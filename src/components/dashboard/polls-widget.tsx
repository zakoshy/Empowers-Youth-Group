
"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Vote, Edit, Trash2 } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, orderBy, addDoc, doc, updateDoc, getDoc, deleteDoc, getDocs, writeBatch, setDoc } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton"
import { PollFormDialog } from "./poll-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export type Poll = {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  endDate: string;
  creatorId: string;
  voted?: string[]; // Array of user IDs who voted
}

interface UserProfile {
    role: string;
}

export function PollsWidget() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [now] = useState(() => new Date().toISOString());

  const pollsRef = useMemoFirebase(() => query(
    collection(firestore, 'polls'),
    orderBy('endDate', 'desc'),
  ), [firestore]);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const { data: polls, isLoading: isLoadingPolls, error } = useCollection<Poll>(pollsRef);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleVote = async (poll: Poll) => {
    if (!user) {
      toast({ variant: 'destructive', title: "You must be logged in to vote."});
      return;
    }
    const selectedOptionId = selectedOptions[poll.id];
    if (!selectedOptionId) {
      toast({ variant: 'destructive', title: "Please select an option to vote."});
      return;
    }
    
    const voteRef = doc(firestore, 'polls', poll.id, 'votes', user.uid);
    const voteDoc = await getDoc(voteRef);

    if (voteDoc.exists()) {
        toast({ variant: "destructive", title: "You have already voted in this poll." });
        return;
    }

    try {
        // Create a private vote document for the user
        await setDoc(voteRef, {
            pollId: poll.id,
            userId: user.uid,
            selectedOption: selectedOptionId,
            voteDate: new Date().toISOString(),
        });
        
        // Atomically update the public poll results
        const pollRef = doc(firestore, 'polls', poll.id);
        const pollDoc = await getDoc(pollRef);
        if (pollDoc.exists()) {
            const pollData = pollDoc.data() as Poll;
            const updatedOptions = pollData.options.map(opt => 
                opt.id === selectedOptionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
            );
            // Track who has voted to update the UI
            const voted = pollData.voted ? [...pollData.voted, user.uid] : [user.uid];

            await updateDoc(pollRef, { options: updatedOptions, voted: voted });
        }
        
      toast({
        title: "Vote Submitted",
        description: "Thank you for your participation!",
      });
    } catch(error) {
        console.error("Error submitting vote: ", error);
        toast({ variant: "destructive", title: "Could not submit vote." });
    }
  }

  const handleEdit = (poll: Poll) => {
    setEditingPoll(poll);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (pollId: string) => {
    try {
      // First, delete all votes in the subcollection
      const votesRef = collection(firestore, 'polls', pollId, 'votes');
      const votesSnapshot = await getDocs(votesRef);
      const batch = writeBatch(firestore);
      votesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Then, delete the poll itself
      await deleteDoc(doc(firestore, 'polls', pollId));

      toast({
        title: "Poll Deleted",
        description: "The poll has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting poll: ", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the poll. Please try again.",
      });
    }
  };

  const isLoading = isLoadingPolls || isProfileLoading;

  if (isLoading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
          </div>
      )
  }

  const canManagePoll = (poll: Poll) => {
    if (!user || !userProfile) return false;
    return poll.creatorId === user.uid || userProfile.role === 'Chairperson' || userProfile.role === 'Admin';
  }

  const activePolls = polls?.filter(p => new Date(p.endDate) >= new Date(now));
  const pastPolls = polls?.filter(p => new Date(p.endDate) < new Date(now));

  const userHasVoted = (poll: Poll) => poll.voted?.includes(user?.uid || '');
  
  const totalVotes = (poll: Poll) => poll.options.reduce((acc, option) => acc + (option.votes || 0), 0);

  return (
    <div className="space-y-6">
        {polls && polls.length > 0 ? (
            polls.map(poll => {
                const isPollActive = new Date(poll.endDate) >= new Date(now);
                const hasVoted = userHasVoted(poll);
                const pollTotalVotes = totalVotes(poll);

                return (
                <Card key={poll.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2"><Vote className="h-5 w-5 text-primary" /> {poll.question}</CardTitle>
                                <CardDescription>
                                    {isPollActive ? `Poll ends on ${new Date(poll.endDate).toLocaleDateString()}` : `Poll ended on ${new Date(poll.endDate).toLocaleDateString()}`}
                                </CardDescription>
                            </div>
                            {canManagePoll(poll) && (
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(poll)}><Edit className="h-4 w-4" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the poll and all its votes.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(poll.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isPollActive && !hasVoted ? (
                            <RadioGroup 
                                value={selectedOptions[poll.id]} 
                                onValueChange={(value) => setSelectedOptions(prev => ({...prev, [poll.id]: value}))}
                                className="space-y-2"
                            >
                            {poll.options.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.id} id={`${poll.id}-${option.id}`} />
                                <Label htmlFor={`${poll.id}-${option.id}`}>{option.text}</Label>
                                </div>
                            ))}
                            </RadioGroup>
                        ) : (
                            <div className="space-y-2">
                                {poll.options.map(option => {
                                    const percentage = pollTotalVotes > 0 ? ((option.votes || 0) / pollTotalVotes) * 100 : 0;
                                    return (
                                        <div key={option.id} className="space-y-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-medium">{option.text}</span>
                                                <span className="text-muted-foreground">{percentage.toFixed(0)}% ({option.votes || 0} votes)</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2.5">
                                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                    {isPollActive && !hasVoted && (
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={() => handleVote(poll)}
                                disabled={!selectedOptions[poll.id]}
                            >
                                Submit Vote
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            )})
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-muted rounded-lg">
             <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="font-semibold">No polls found</p>
            <p className="text-sm text-muted-foreground">Create the first poll to get started.</p>
          </div>
        )}

        <PollFormDialog
            isOpen={isFormOpen}
            onOpenChange={(open) => {
                if (!open) {
                setEditingPoll(null);
                }
                setIsFormOpen(open);
            }}
            poll={editingPoll}
        />
    </div>
  )
}
