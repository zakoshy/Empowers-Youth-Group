'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface CurrentUserProfile {
  role: string;
}

export function useAllUsers() {
  const firestore = useFirestore();
  const { user } = useUser();

  const currentUserProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);
  
  const { data: currentUserProfile, isLoading: isRoleLoading } = useDoc<CurrentUserProfile>(currentUserProfileRef);
  
  const userRole = currentUserProfile?.role;
  const shouldFetchUsers = userRole === 'Admin' || userRole === 'Treasurer';

  const usersRef = useMemoFirebase(
    () => (firestore && shouldFetchUsers ? collection(firestore, 'userProfiles') : null),
    [firestore, shouldFetchUsers]
  );
  
  const { data, isLoading: usersLoading, error } = useCollection<UserProfile>(usersRef);

  return { users: data || [], isLoading: isRoleLoading || usersLoading, error, userRole };
}
