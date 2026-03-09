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
import { FileText, Phone, Wand2, Loader2, Banknote as BankIcon, DollarSign, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";
import { MinutesWidget } from "@/components/dashboard/minutes-widget";
import { SavedIdeasWidget } from "@/components/dashboard/saved-ideas-widget";
import { ApprovalPending } from "@/components/dashboard/approval-pending";

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
  status: 'pending' | 'active';
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden">
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

  if (userProfile?.status === 'pending') {
    return <ApprovalPending />;
  }

  const welcomeName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user?.displayName || 'Member';
  const userRole = userProfile?.role;
  const showPersonalizedSuggestions = userRole && !['Admin', 'Investment Lead'].includes(userRole);

  return (
    <div className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold font-headline">Welcome, {welcomeName}!</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Here's a summary of your activities and group updates.</p>
      </div>

      <Card className="w-full">
          <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Make a Contribution</CardTitle>
              <CardDescription className="text-sm">Use the buttons below to pay your monthly contribution or make a special "miniharambee" payment via M-Pesa.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="w-full" size="lg">
                  <a href="https://lipana.dev/pay/monthly-contribution" target="_blank" rel="noopener noreferrer">
                      <DollarSign className="mr-2 h-4 w-4" /> Pay Monthly
                  </a>
              </Button>
              <Button asChild style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}} className="w-full" size="lg">
                  <a href="https://lipana.dev/pay/mini-harambee" target="_blank" rel="noopener noreferrer">
                      <Gift className="mr-2 h-4 w-4" /> Pay Miniharambee
                  </a>
              </Button>
          </CardContent>
      </Card>
      
      <div className="grid gap-4 sm:grid-cols-2 w-full">
          <Card className="bg-primary/5 w-full">
              <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <span>M-Pesa Contribution</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                  Use the till number below.
              </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <p className="text-xl sm:text-2xl font-bold font-mono tracking-widest break-all">0112263590</p>
              </CardContent>
          </Card>
          <Card className="bg-accent/10 w-full">
              <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BankIcon className="h-5 w-5 text-accent shrink-0" />
                  <span>Equity Bank Account</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                  Use Paybill <strong>247247</strong>.
              </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <p className="text-xl sm:text-2xl font-bold font-mono tracking-widest break-all">1050187008802</p>
              </CardContent>
          </div>
      </div>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-3 w-full">
        <div className="lg:col-span-2 grid gap-6">
            {userRole === 'Investment Lead' ? <InvestmentSuggestions /> : (showPersonalizedSuggestions && <PersonalizedSuggestions />)}
            <SavedIdeasWidget />
            <ReportsWidget />
            <MinutesWidget />
        </div>
        <div className="lg:col-span-1 grid gap-6">
            <EventsWidget />
            {userRole !== 'Admin' && <PollsWidget />}
        </div>
      </div>
    </div>
  );
}
