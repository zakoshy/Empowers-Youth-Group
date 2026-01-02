
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
import { FileText, Phone, Wand2, Loader2, Banknote as BankIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";
import { MinutesWidget } from "@/components/dashboard/minutes-widget";
import { SavedIdeasWidget } from "@/components/dashboard/saved-ideas-widget";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
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
        
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-primary/5">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    <span>M-Pesa Contribution Details</span>
                </CardTitle>
                <CardDescription>
                    Use the till number below to send your monthly contributions.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <p className="text-2xl font-bold font-mono tracking-widest">0112263590</p>
                </CardContent>
            </Card>
            <Card className="bg-accent/10">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BankIcon className="h-5 w-5" />
                    <span>Equity Bank Account</span>
                </CardTitle>
                <CardDescription>
                    Use Paybill <strong>247247</strong> with the account number below.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <p className="text-2xl font-bold font-mono tracking-widest">1050187008802</p>
                </CardContent>
            </Card>
        </div>


        <StatsCards />

        <div className="grid gap-6 lg:grid-cols-3">
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
    </>
  );
}
