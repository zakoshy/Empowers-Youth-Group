
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export function useAllUsers() {
  const firestore = useFirestore();
  const usersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'userProfiles') : null),
    [firestore]
  );
  const { data, isLoading, error } = useCollection<UserProfile>(usersRef);

  return { users: data || [], isLoading, error };
}
