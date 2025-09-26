
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { EventsWidget } from "@/components/dashboard/events-widget";
import { ReportsWidget } from "@/components/dashboard/reports-widget";
import { PollsWidget } from "@/components/dashboard/polls-widget";
import { PersonalizedSuggestions } from "@/components/dashboard/personalized-suggestions";
import { constitution } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
  const isAdmin = userProfile?.role === 'Admin';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome, {welcomeName}!</h1>
        <p className="text-muted-foreground">Here's a summary of your activities and group updates.</p>
      </div>

      {!isAdmin && <StatsCards />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-6">
            <PersonalizedSuggestions />
            <ReportsWidget />
        </div>
        <div className="lg:col-span-1 grid gap-6">
            <EventsWidget />
            {!isAdmin && <PollsWidget />}
        </div>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Group Constitution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The guiding document for our group. Last updated: {constitution.lastUpdated}
          </p>
          <Button asChild variant="outline">
            <Link href={constitution.url} target="_blank">
                <FileText className="mr-2 h-4 w-4" />
                View Constitution
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
