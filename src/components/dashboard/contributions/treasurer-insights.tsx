
'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2 } from 'lucide-react';
import { getTreasurerInsights } from '@/ai/flows/treasurer-insights';

interface TreasurerInsightsProps {
  allMembersData: any[];
  totalFunds: number;
  monthlyTarget: number;
}

export function TreasurerInsights({
  allMembersData,
  totalFunds,
  monthlyTarget,
}: TreasurerInsightsProps) {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInsights() {
      if (!allMembersData.length) {
          setInsights("No member data available to generate insights.");
          setLoading(false);
          return
      };

      try {
        setLoading(true);
        setError('');

        const input = {
          allMembersData: JSON.stringify(allMembersData),
          totalFunds,
          monthlyTarget,
        };

        const result = await getTreasurerInsights(input);
        setInsights(result.insights);
      } catch (err) {
        console.error('Error fetching AI insights:', err);
        setError(
          'Could not load AI insights at this time. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [allMembersData, totalFunds, monthlyTarget]);

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          <CardTitle>AI-Powered Treasurer Insights</CardTitle>
        </div>
        <CardDescription>
          Analytics and actionable recommendations based on the group's financial data.
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
          <div className="prose prose-sm max-w-none text-foreground/80 dark:prose-invert prose-headings:font-headline prose-headings:text-foreground">
            <div dangerouslySetInnerHTML={{ __html: insights.replace(/\\n/g, '<br />') }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
