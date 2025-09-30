'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ReportsList } from '@/components/dashboard/reports/reports-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock } from 'lucide-react';

interface UserProfile {
  role: string;
}

export default function ManageReportsPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const isLoading = isUserLoading || isProfileLoading;
  const canManage = userProfile?.role === 'Investment Lead' || userProfile?.role === 'Admin';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!canManage) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Access Denied</CardTitle>
                  <CardDescription>This page is for managing investment reports.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                      <Lock className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-muted-foreground">Only the Investment Lead or an Admin can manage reports.</p>
                      <p className="text-sm text-muted-foreground">You can view reports on the main dashboard.</p>
                  </div>
              </CardContent>
          </Card>
      )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Investment Reports</CardTitle>
            <CardDescription>Upload, update, and manage all group investment reports.</CardDescription>
          </div>
          <Button onClick={() => router.push('/dashboard/reports/new')}>Upload New Report</Button>
        </CardHeader>
        <CardContent>
          <ReportsList />
        </CardContent>
      </Card>
    </div>
  );
}
