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
  const { user, isUserLoading } = useUser();

  const currentUserProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);
  
  const { data: currentUserProfile, isLoading: isRoleLoading } = useDoc<CurrentUserProfile>(currentUserProfileRef);
  
  const userRole = currentUserProfile?.role;
  const shouldFetchUsers = !isRoleLoading && (userRole === 'Admin' || userRole === 'Treasurer');

  // This is the critical change: ensure the query is only created when all conditions are met.
  const usersRef = useMemoFirebase(
    () => {
      if (firestore && shouldFetchUsers) {
        return collection(firestore, 'userProfiles');
      }
      return null;
    },
    [firestore, shouldFetchUsers]
  );
  
  const { data, isLoading: usersLoading, error } = useCollection<UserProfile>(usersRef);

  // The overall loading state must account for the initial user and role checks.
  const isLoading = isUserLoading || isRoleLoading || (shouldFetchUsers && usersLoading);

  return { users: data || [], isLoading, error, userRole };
}
