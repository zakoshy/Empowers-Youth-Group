'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';
import { format } from "date-fns";
import { useToast } from '@/hooks/use-toast';
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
import ReactMarkdown from 'react-markdown';


interface InvestmentIdea {
    id: string;
    content: string;
    savedBy: string;
    savedDate: string;
}

interface UserProfile {
    role: string;
}

export function SavedIdeasWidget() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'userProfiles', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const canManage = userProfile?.role === 'Investment Lead' || userProfile?.role === 'Admin' || userProfile?.role === 'Chairperson';

  const ideasRef = useMemoFirebase(() => query(
    collection(firestore, 'investmentIdeas'),
    orderBy('savedDate', 'desc'),
    limit(10)
  ), [firestore]);

  const { data: ideas, isLoading } = useCollection<InvestmentIdea>(ideasRef);

  const handleDelete = async (ideaId: string) => {
    try {
        await deleteDoc(doc(firestore, 'investmentIdeas', ideaId));
        toast({
            title: "Idea Deleted",
            description: "The saved investment idea has been removed.",
        });
    } catch (error) {
        console.error("Error deleting idea:", error);
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: "Could not delete the idea. Check permissions.",
        });
    }
  }

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </CardContent>
        </Card>
    )
  }

  if (!ideas || ideas.length === 0) {
    return null; 
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Saved Investment Ideas</CardTitle>
        <CardDescription>Promising ideas for the group to consider.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {ideas.map((idea) => (
            <div key={idea.id} className="p-4 border rounded-lg bg-background/50 flex flex-col gap-4">
                <div className="prose prose-sm max-w-none text-foreground/90 dark:prose-invert">
                    <ReactMarkdown>{idea.content}</ReactMarkdown>
                </div>
                <div className="flex justify-between items-center pt-2 border-t mt-auto">
                    <p className="text-xs text-muted-foreground italic">
                        Saved {format(new Date(idea.savedDate), "MMM d, yyyy")}
                    </p>
                    {canManage && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[90vw] max-w-md">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action will remove this suggestion from the group's saved records.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex flex-row gap-2 justify-end">
                                <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(idea.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
        ))}
      </CardContent>
    </Card>
  )
}
