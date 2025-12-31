'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenditureManagement } from '@/components/dashboard/expenditure/expenditure-management';
import { ExpenditureView } from '@/components/dashboard/expenditure/expenditure-view';

interface UserProfile {
  role: string;
}

export default function ExpenditurePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isUserLoading || isProfileLoading;
  const isTreasurer = userProfile?.role === 'Treasurer';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isTreasurer) {
    return <ExpenditureManagement />;
  }

  return <ExpenditureView />;
}
