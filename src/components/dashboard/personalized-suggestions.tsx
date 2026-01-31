"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wand2, Loader2 } from "lucide-react";
import { getPersonalizedSuggestions } from "@/ai/flows/personalized-community-suggestions";
import { investmentReports } from "@/lib/data";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import type { Event } from "@/lib/data";

interface UserProfile {
  id: string;
  role: string;
}

interface Contribution {
    month: number;
    year: number;
    amount: number;
}

interface SpecialContribution {
    month: number;
    year: number;
    amount: number;
    date: string;
}

export function PersonalizedSuggestions() {
  const [suggestions, setSuggestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const contributionsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'userProfiles', user.uid, 'contributions');
    }, [firestore, user]);

  const specialContributionsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'userProfiles', user.uid, 'specialContributions');
  }, [firestore, user]);
  
  const eventsRef = useMemoFirebase(() => query(
    collection(firestore, 'events'),
    orderBy('date', 'asc'),
    limit(5)
  ), [firestore]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const { data: contributions } = useCollection<Contribution>(contributionsRef);
  const { data: specialContributions } = useCollection<SpecialContribution>(specialContributionsRef);
  const { data: events } = useCollection<Event>(eventsRef);

  async function fetchSuggestions() {
    if (!userProfile || contributions === null || specialContributions === null || !events) {
        setError("Could not load your data to generate suggestions. Please try again in a moment.");
        return;
    }

    try {
      setLoading(true);
      setError("");
      setSuggestions("");
      
      const contributionSummary = {
          monthlyContributions: contributions,
          specialContributions: specialContributions
      }

      const input = {
        memberId: userProfile.id,
        investmentReports: JSON.stringify(investmentReports),
        upcomingEvents: JSON.stringify(events),
        contributionSummary: JSON.stringify(contributionSummary),
        memberRole: userProfile.role,
      };

      const result = await getPersonalizedSuggestions(input);
      setSuggestions(result.suggestions);

    } catch (err: any) {
      console.error("Error fetching AI suggestions:", err);
      if (err.message && err.message.includes('RESOURCE_EXHAUSTED')) {
         setError("The AI is a bit busy right now due to high demand. Please try again in a few moments.");
      } else {
         setError("Could not load suggestions at this time. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-card">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            <CardTitle>Personalized Suggestions</CardTitle>
        </div>
        <CardDescription>
          AI-powered ideas for your engagement in the community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {suggestions && (
            <div className="text-sm text-foreground/80 whitespace-pre-line">
                {suggestions}
            </div>
        )}
        
        {!loading && !error && !suggestions && (
          <p className="text-sm text-muted-foreground">Click the button to get personalized suggestions from our AI mentor.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={fetchSuggestions} disabled={loading}>
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            "Get AI Suggestions"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
