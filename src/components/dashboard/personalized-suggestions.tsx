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
import { Wand2 } from "lucide-react";
import { getPersonalizedSuggestions } from "@/ai/flows/personalized-community-suggestions";
import { investmentReports, events } from "@/lib/data";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";

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
  const [loading, setLoading] = useState(true);
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

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const { data: contributions } = useCollection<Contribution>(contributionsRef);
  const { data: specialContributions } = useCollection<SpecialContribution>(specialContributionsRef);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!userProfile || contributions === null || specialContributions === null) return;

      try {
        setLoading(true);
        setError("");
        
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

      } catch (err) {
        console.error("Error fetching AI suggestions:", err);
        setError("Could not load suggestions at this time. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    if (userProfile && contributions !== null && specialContributions !== null) {
      fetchSuggestions();
    }
  }, [userProfile, contributions, specialContributions]);

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
        {!loading && !error && (
            <div className="text-sm text-foreground/80 whitespace-pre-line">
                {suggestions}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
