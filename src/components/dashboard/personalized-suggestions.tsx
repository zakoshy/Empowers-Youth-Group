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
import { memberData, investmentReports, events } from "@/lib/data";

export function PersonalizedSuggestions() {
  const [suggestions, setSuggestions] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        setLoading(true);
        setError("");
        
        const input = {
          memberId: memberData.id,
          investmentReports: JSON.stringify(investmentReports),
          upcomingEvents: JSON.stringify(events),
          contributionSummary: JSON.stringify(memberData.financialSummary),
          memberRole: memberData.role,
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

    fetchSuggestions();
  }, []);

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
