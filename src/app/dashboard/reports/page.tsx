
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ReportsList } from '@/components/dashboard/reports/reports-list';
import { Skeleton } from '@/components/ui/skeleton';

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
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{canManage ? "Manage Investment Reports" : "Investment Reports"}</CardTitle>
            <CardDescription>
              {canManage 
                ? "Upload, update, and manage all group investment reports." 
                : "View the latest reports on group investment activities."}
            </CardDescription>
          </div>
          {canManage && (
            <Button onClick={() => router.push('/dashboard/reports/new')}>Upload New Report</Button>
          )}
        </CardHeader>
        <CardContent>
          <ReportsList isReadOnly={!canManage} />
        </CardContent>
      </Card>
    </div>
  );
}
