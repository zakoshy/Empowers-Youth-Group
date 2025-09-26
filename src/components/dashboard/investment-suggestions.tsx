
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb } from "lucide-react";
import { getInvestmentSuggestions } from "@/ai/flows/investment-suggestions";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, getDocs } from "firebase/firestore";

interface Contribution {
    amount: number;
}

export function InvestmentSuggestions() {
  const [suggestions, setSuggestions] = useState("");
  const [totalFunds, setTotalFunds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const firestore = useFirestore();

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
            <div className="text-sm text-foreground/80 whitespace-pre-line">
                {suggestions}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
