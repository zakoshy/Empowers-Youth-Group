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
  // Ensure shouldFetchUsers is only true when the role has been loaded and is explicitly one of these
  const shouldFetchUsers = !isRoleLoading && (userRole === 'Admin' || userRole === 'Treasurer');

  const usersRef = useMemoFirebase(
    () => {
        // Only create the collection reference if firestore is ready AND the user should fetch.
        if (firestore && shouldFetchUsers) {
            return collection(firestore, 'userProfiles');
        }
        return null;
    },
    [firestore, shouldFetchUsers]
  );
  
  const { data, isLoading: usersLoading, error } = useCollection<UserProfile>(usersRef);

  // The overall loading state depends on whether we are trying to fetch users or not.
  const isLoading = isRoleLoading || (shouldFetchUsers && usersLoading);

  return { users: data || [], isLoading, error, userRole };
}
