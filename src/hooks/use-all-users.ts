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
  const shouldFetchUsers = !isUserLoading && !isRoleLoading && (userRole === 'Admin' || userRole === 'Treasurer');

  const usersRef = useMemoFirebase(
    () => {
      // Only create the collection reference if all conditions are met
      if (firestore && shouldFetchUsers) {
        return collection(firestore, 'userProfiles');
      }
      // Otherwise, return null to prevent the query
      return null;
    },
    [firestore, shouldFetchUsers]
  );

  const { data, isLoading: usersLoading, error } = useCollection<UserProfile>(usersRef);

  // The overall loading state must account for the initial user and role checks.
  const isLoading = isUserLoading || isRoleLoading || (shouldFetchUsers && usersLoading);

  return { users: data || [], isLoading, error, userRole };
}
