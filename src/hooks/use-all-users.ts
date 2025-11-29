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
  const { user, isUserLoading: isAuthLoading } = useUser();

  const currentUserProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: currentUserProfile, isLoading: isRoleLoading } = useDoc<CurrentUserProfile>(currentUserProfileRef);

  const userRole = currentUserProfile?.role;
  const canFetchUsers = userRole === 'Admin' || userRole === 'Treasurer';

  const usersRef = useMemoFirebase(
    () => {
      // Only create the collection reference if the user has the correct role
      if (firestore && canFetchUsers) {
        return collection(firestore, 'userProfiles');
      }
      // Return null otherwise to prevent the query
      return null;
    },
    [firestore, canFetchUsers] 
  );

  const { data, isLoading: usersLoading, error } = useCollection<UserProfile>(usersRef);

  // The overall loading state is true if we are still verifying auth, role, or fetching users.
  const isLoading = isAuthLoading || isRoleLoading || (canFetchUsers && usersLoading);
  
  // Return empty array if we can't fetch users
  const usersData = canFetchUsers ? data : [];

  return { users: usersData || [], isLoading, error, userRole };
}
