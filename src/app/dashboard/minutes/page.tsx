'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { MinutesList } from '@/components/dashboard/minutes/minutes-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock } from 'lucide-react';

interface UserProfile {
  role: string;
}

export default function ManageMinutesPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const isLoading = isUserLoading || isProfileLoading;
  const isSecretary = userProfile?.role === 'Secretary' || userProfile?.role === 'Admin';

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
            <CardTitle>Meeting Minutes</CardTitle>
            <CardDescription>
              {isSecretary
                ? "Upload, update, and manage all group meeting minutes."
                : "Review the official records from group meetings."}
            </CardDescription>
          </div>
          {isSecretary && (
            <Button onClick={() => router.push('/dashboard/minutes/new')}>Upload New Minute</Button>
          )}
        </CardHeader>
        <CardContent>
          <MinutesList isReadOnly={!isSecretary} />
        </CardContent>
      </Card>
    </div>
  );
}
