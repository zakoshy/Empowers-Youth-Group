
'use client';

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { EventsWidget } from "@/components/dashboard/events-widget";
import { ReportsWidget } from "@/components/dashboard/reports-widget";
import { PollsWidget } from "@/components/dashboard/polls-widget";
import { PersonalizedSuggestions } from "@/components/dashboard/personalized-suggestions";
import { InvestmentSuggestions } from "@/components/dashboard/investment-suggestions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Phone, Wand2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { summarizeConstitution } from "@/ai/flows/summarize-constitution";
import { extractTextFromPdf } from "@/lib/pdf-utils";

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
}

interface Constitution {
    id: string;
    title: string;
    content: string; // URL to the file
    uploadDate: string;
    fileName: string;
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const constitutionRef = useMemoFirebase(() => doc(firestore, 'constitution', 'main'), [firestore]);
  const { data: constitutionData, isLoading: isConstitutionLoading } = useDoc<Constitution>(constitutionRef);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const handleSummarize = async () => {
    if (!constitutionData) {
        setSummary("The constitution document has not been uploaded yet.");
        setIsSummaryOpen(true);
        return;
    };
    
    setIsSummaryOpen(true);
    if (summary) return; // Don't re-fetch if summary is already loaded

    setIsSummaryLoading(true);
    try {
      // Fetch the PDF and extract text on the client
      const constitutionText = await extractTextFromPdf(constitutionData.content);
      if (!constitutionText) {
        throw new Error("Could not extract text from the PDF.");
      }
      
      const result = await summarizeConstitution({ constitutionText });
      setSummary(result.summary);
    } catch (error) {
      console.error("Failed to get summary:", error);
      setSummary("Sorry, the summary could not be generated at this time. The document might be inaccessible or corrupted.");
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const isLoading = isUserLoading || isProfileLoading || isConstitutionLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 grid gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <div className="lg:col-span-1 grid gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  const welcomeName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user?.displayName || 'Member';
  const userRole = userProfile?.role;
  const isMemberView = userRole && !['Admin', 'Investment Lead', 'Treasurer'].includes(userRole);
  const showPersonalizedSuggestions = userRole && !['Admin', 'Investment Lead'].includes(userRole);


  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Welcome, {welcomeName}!</h1>
          <p className="text-muted-foreground">Here's a summary of your activities and group updates.</p>
        </div>
        
        {isMemberView && (
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <span>M-Pesa Contribution Details</span>
              </CardTitle>
              <CardDescription>
                Use the number below to send your monthly contributions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono tracking-widest">0112263590</p>
            </CardContent>
          </Card>
        )}

        {isMemberView && <StatsCards />}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 grid gap-6">
              {userRole === 'Investment Lead' ? <InvestmentSuggestions /> : (showPersonalizedSuggestions && <PersonalizedSuggestions />)}
              <ReportsWidget />
          </div>
          <div className="lg:col-span-1 grid gap-6">
              <EventsWidget />
              {isMemberView && <PollsWidget />}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Group Constitution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-start">
            <div>
              <p className="text-muted-foreground mb-4">
                {constitutionData 
                    ? `The guiding document for our group. Last updated: ${new Date(constitutionData.uploadDate).toLocaleDateString()}`
                    : "The group constitution has not been uploaded yet."
                }
              </p>
              <div className="flex gap-2">
                {constitutionData ? (
                    <Button variant="outline" onClick={() => setIsViewerOpen(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Constitution
                    </Button>
                ) : (
                    <Button variant="outline" disabled>
                        <FileText className="mr-2 h-4 w-4" />
                        View Constitution
                    </Button>
                )}
                <Button onClick={handleSummarize} disabled={!constitutionData || isSummaryLoading}>
                    {isSummaryLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    {isSummaryLoading ? 'Analyzing...' : 'Summarize with AI'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>AI Constitution Summary</DialogTitle>
            <DialogDescription>
              Here's a quick overview of the group's constitution. For full details, please refer to the complete document.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isSummaryLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating summary...</p>
                </div>
              </div>
            ) : (
                <div className="prose prose-sm max-w-none text-foreground/80 dark:prose-invert prose-headings:font-headline prose-headings:text-foreground"
                    dangerouslySetInnerHTML={{ __html: summary }}
                />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{constitutionData?.fileName || 'Group Constitution'}</DialogTitle>
            <DialogDescription>
              You can scroll to view the document. Use your browser's print functionality (Ctrl/Cmd+P) to print or save as PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="h-full w-full py-4 -mx-6 px-6">
            {constitutionData?.content ? (
              <iframe
                src={constitutionData.content}
                className="w-full h-full border rounded-md"
                title="Constitution Document"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Document could not be loaded.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
