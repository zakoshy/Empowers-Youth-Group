

"use client"

import { useState, useEffect } from "react"
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
import { CheckCircle, Vote, Edit, Trash2, Loader2 } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, orderBy, addDoc, doc, updateDoc, getDoc, deleteDoc, getDocs, writeBatch, setDoc, onSnapshot, runTransaction, collectionGroup, arrayUnion, arrayRemove } from "firebase/firestore";
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
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../ui/tooltip";


export type Poll = {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  endDate: string;
  creatorId: string;
  voters?: {
      userId: string;
      firstName: string;
      lastName: string;
      photoURL: string | null;
      selectedOption: string;
  }[];
}

type VoteRecord = {
    id: string;
    userId: string;
    selectedOption: string;
}

interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    photoURL?: string;
    role: string;
}

const getInitials = (firstName: string = '', lastName: string = '') => {
    return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
};

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
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [isSubmittingVote, setIsSubmittingVote] = useState<Record<string, boolean>>({});


  useEffect(() => {
    if (!user || !polls) return;

    const unsubscribes = polls.map(poll => {
        const voteRef = doc(firestore, 'polls', poll.id, 'votes', user.uid);
        // Subscribe to current user's vote
        const unsubUserVote = onSnapshot(voteRef, (doc) => {
            if (doc.exists()) {
                const voteData = doc.data() as VoteRecord;
                setUserVotes(prev => ({...prev, [poll.id]: voteData.selectedOption}))
                setSelectedOptions(prev => ({...prev, [poll.id]: voteData.selectedOption}));
            }
        });
        
        return unsubUserVote;
    });

    return () => unsubscribes.flat().forEach(unsub => unsub());
  }, [user, polls, firestore])


  const handleVote = async (poll: Poll) => {
    if (!user || !userProfile) {
      toast({ variant: 'destructive', title: "You must be logged in to vote."});
      return;
    }
    const newOptionId = selectedOptions[poll.id];
    if (!newOptionId) {
      toast({ variant: 'destructive', title: "Please select an option to vote."});
      return;
    }
    
    setIsSubmittingVote(prev => ({ ...prev, [poll.id]: true }));

    const voteRef = doc(firestore, 'polls', poll.id, 'votes', user.uid);
    const pollRef = doc(firestore, 'polls', poll.id);

    try {
        const previousVote = userVotes[poll.id];
        const isChangingVote = !!previousVote;

        await runTransaction(firestore, async (transaction) => {
            const pollDoc = await transaction.get(pollRef);

            if (!pollDoc.exists()) throw "Poll does not exist!";
            if (new Date(pollDoc.data().endDate) < new Date()) throw "This poll has already ended.";

            const pollData = pollDoc.data() as Poll;
            let updatedOptions = [...pollData.options];
            let updatedVoters = pollData.voters || [];
            
            const voterInfo = {
                userId: user.uid,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                photoURL: userProfile.photoURL || null,
                selectedOption: newOptionId
            };
            
            if (isChangingVote) {
                if (previousVote === newOptionId) return; // No change needed

                // Decrement old vote count
                updatedOptions = updatedOptions.map(opt => 
                    opt.id === previousVote ? { ...opt, votes: Math.max(0, (opt.votes || 0) - 1) } : opt
                );
                // Remove old voter entry
                updatedVoters = updatedVoters.filter(v => v.userId !== user.uid);
            }

            // Increment new vote count
            updatedOptions = updatedOptions.map(opt => 
                opt.id === newOptionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
            );
            // Add new voter entry
            updatedVoters.push(voterInfo);
            
            transaction.update(pollRef, { options: updatedOptions, voters: updatedVoters });

            transaction.set(voteRef, {
                pollId: poll.id,
                userId: user.uid,
                selectedOption: newOptionId,
                voteDate: new Date().toISOString(),
            });
        });
      
      // Manually update local state to reflect the change immediately
      setUserVotes(prev => ({ ...prev, [poll.id]: newOptionId }));

      if (isChangingVote && previousVote !== newOptionId) {
        toast({
            title: "Vote Updated",
            description: "Your vote has been successfully changed!",
        });
      } else if (!isChangingVote) {
        toast({
            title: "Vote Submitted",
            description: "Thank you for your participation!",
        });
      }

    } catch(error: any) {
        console.error("Error submitting vote: ", error);
        toast({ variant: "destructive", title: "Could not submit vote.", description: error.toString() });
    } finally {
        setIsSubmittingVote(prev => ({ ...prev, [poll.id]: false }));
    }
  }

  const handleEdit = (poll: Poll) => {
    setEditingPoll(poll);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (pollId: string) => {
    try {
      const votesRef = collection(firestore, 'polls', pollId, 'votes');
      const votesSnapshot = await getDocs(votesRef);
      const batch = writeBatch(firestore);
      votesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

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
  
  const totalVotes = (poll: Poll) => poll.options.reduce((acc, option) => acc + (option.votes || 0), 0);
  
  return (
    <div className="space-y-6">
        {polls && polls.length > 0 ? (
            polls.map(poll => {
                const isPollActive = new Date(poll.endDate) > new Date();
                const pollTotalVotes = totalVotes(poll);
                const userVoteOptionId = userVotes[poll.id];
                const votersForPoll = poll.voters || [];
                const hasVoted = !!userVoteOptionId;
                const submitting = isSubmittingVote[poll.id];

                const shouldShowResults = hasVoted || !isPollActive;

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
                        {shouldShowResults ? (
                            <TooltipProvider>
                                <div className="space-y-4">
                                    {poll.options.map(option => {
                                        const percentage = pollTotalVotes > 0 ? ((option.votes || 0) / pollTotalVotes) * 100 : 0;
                                        const isUserChoice = option.id === userVoteOptionId;
                                        
                                        const votersForOption = votersForPoll.filter(v => v.selectedOption === option.id);

                                        return (
                                            <div key={option.id} className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("font-medium", isUserChoice && "text-primary")}>{option.text}</span>
                                                        {isUserChoice && <CheckCircle className="h-4 w-4 text-primary"/>}
                                                    </div>
                                                    <span className="text-muted-foreground">{percentage.toFixed(0)}% ({option.votes || 0} votes)</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2.5">
                                                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                                <div className="flex items-center gap-1 flex-wrap pt-1 min-h-[28px]">
                                                    {votersForOption.map(voter => {
                                                        const isCurrentUser = voter.userId === user?.uid;
                                                        
                                                        return (
                                                            <Tooltip key={voter.userId}>
                                                                <TooltipTrigger>
                                                                    <Avatar className={cn("h-6 w-6 border-2", isCurrentUser ? "border-primary" : "border-transparent")}>
                                                                        <AvatarImage src={voter.photoURL || undefined} />
                                                                        <AvatarFallback className="text-xs">{getInitials(voter.firstName, voter.lastName)}</AvatarFallback>
                                                                    </Avatar>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{voter.firstName} {voter.lastName}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </TooltipProvider>
                        ) : (
                             <RadioGroup 
                                value={selectedOptions[poll.id]} 
                                onValueChange={(value) => setSelectedOptions(prev => ({...prev, [poll.id]: value}))}
                                className="space-y-2"
                                disabled={!isPollActive}
                            >
                            {poll.options.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.id} id={`${poll.id}-${option.id}`} />
                                <Label htmlFor={`${poll.id}-${option.id}`} className="cursor-pointer">{option.text}</Label>
                                </div>
                            ))}
                            </RadioGroup>
                        )}
                    </CardContent>
                     {isPollActive && !hasVoted && (
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={() => handleVote(poll)}
                                disabled={!selectedOptions[poll.id] || submitting}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Vote
                            </Button>
                        </CardFooter>
                    )}
                     {isPollActive && hasVoted && (
                        <CardFooter>
                           <Button
                                className="w-full"
                                onClick={() => handleVote(poll)}
                                disabled={!selectedOptions[poll.id] || submitting}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Change Vote
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
