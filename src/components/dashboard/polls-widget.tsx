
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
import { CheckCircle, Vote } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton"

export type Poll = {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  endDate: string;
  creatorId: string;
  voted?: string[]; // Array of user IDs who voted
}

export function PollsWidget() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [now] = useState(() => new Date().toISOString());

  const pollsRef = useMemoFirebase(() => query(
    collection(firestore, 'polls'),
    where('endDate', '>=', now),
    orderBy('endDate', 'asc'),
  ), [firestore, now]);

  const { data: polls, isLoading } = useCollection<Poll>(pollsRef);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

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
        await addDoc(collection(firestore, 'polls', poll.id, 'votes'), {
            pollId: poll.id,
            userId: user.uid,
            selectedOption: selectedOptionId,
            voteDate: new Date().toISOString(),
        });
        
        const pollRef = doc(firestore, 'polls', poll.id);
        const pollDoc = await getDoc(pollRef);
        if (pollDoc.exists()) {
            const pollData = pollDoc.data() as Poll;
            const updatedOptions = pollData.options.map(opt => 
                opt.id === selectedOptionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
            );
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

  const activePolls = polls?.filter(p => !p.voted?.includes(user?.uid || ''));

  if (isLoading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
          </div>
      )
  }

  return (
    <div className="space-y-6">
        {activePolls && activePolls.length > 0 ? (
            activePolls.map(poll => (
                <Card key={poll.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Vote className="h-5 w-5 text-primary" /> {poll.question}</CardTitle>
                        <CardDescription>This poll ends on {new Date(poll.endDate).toLocaleDateString()}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup 
                            value={selectedOptions[poll.id]} 
                            onValueChange={(value) => setSelectedOptions(prev => ({...prev, [poll.id]: value}))}
                        >
                        {poll.options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`${poll.id}-${option.id}`} />
                            <Label htmlFor={`${poll.id}-${option.id}`}>{option.text}</Label>
                            </div>
                        ))}
                        </RadioGroup>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={() => handleVote(poll)}
                            disabled={!selectedOptions[poll.id]}
                        >
                            Submit Vote
                        </Button>
                    </CardFooter>
                </Card>
            ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-muted rounded-lg">
             <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="font-semibold">No active polls</p>
            <p className="text-sm text-muted-foreground">You are all caught up. Check back later!</p>
          </div>
        )}
    </div>
  )
}
