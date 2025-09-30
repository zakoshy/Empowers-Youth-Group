
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Lightbulb, Save, Loader2 } from "lucide-react";
import { getInvestmentSuggestions } from "@/ai/flows/investment-suggestions";
import { useFirestore, useUser } from "@/firebase";
import { collectionGroup, query, getDocs, addDoc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface Contribution {
    amount: number;
}

export function InvestmentSuggestions() {
  const [suggestions, setSuggestions] = useState("");
  const [totalFunds, setTotalFunds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTotalFundsAndSuggestions() {
      try {
        setLoading(true);
        setError("");

        const contributionsQuery = query(collectionGroup(firestore, 'contributions'));
        const specialContributionsQuery = query(collectionGroup(firestore, 'specialContributions'));

        const contributionsSnapshot = await getDocs(contributionsQuery);
        const specialContributionsSnapshot = await getDocs(specialContributionsQuery);

        let calculatedTotal = 0;
        contributionsSnapshot.forEach(doc => {
            calculatedTotal += (doc.data() as Contribution).amount;
        });
        specialContributionsSnapshot.forEach(doc => {
            calculatedTotal += (doc.data() as Contribution).amount;
        });

        setTotalFunds(calculatedTotal);

        if (calculatedTotal > 0) {
            const result = await getInvestmentSuggestions({ totalFunds: calculatedTotal });
            setSuggestions(result.suggestions);
        } else {
            setSuggestions("No funds collected yet. Start contributing to get investment suggestions.");
        }

      } catch (err) {
        console.error("Error fetching AI suggestions:", err);
        setError("Could not load investment suggestions at this time. Please check your permissions or try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchTotalFundsAndSuggestions();
  }, [firestore]);

  const handleSaveSuggestion = async () => {
    if (!suggestions || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No suggestion to save or user not logged in."
        });
        return;
    }
    setIsSaving(true);
    try {
        await addDoc(collection(firestore, 'investmentIdeas'), {
            content: suggestions,
            savedBy: user.uid,
            savedDate: new Date().toISOString(),
        });
        toast({
            title: "Idea Saved!",
            description: "The investment suggestion has been saved for the group."
        })
    } catch (error) {
        console.error("Error saving suggestion:", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save the idea. Check permissions or try again."
        })
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-card">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            <CardTitle>AI-Powered Investment Suggestions</CardTitle>
        </div>
        <CardDescription>
          Based on the group's current total funds of <span className="font-bold text-primary">Ksh {totalFunds.toLocaleString()}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && (
            <div className="prose prose-sm max-w-none text-foreground/80 dark:prose-invert prose-headings:font-headline prose-headings:text-foreground"
                dangerouslySetInnerHTML={{ __html: suggestions }}
            />
        )}
      </CardContent>
      {!loading && !error && suggestions && (
        <CardFooter>
            <Button onClick={handleSaveSuggestion} disabled={isSaving}>
                {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Idea for the Group"}
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}

    