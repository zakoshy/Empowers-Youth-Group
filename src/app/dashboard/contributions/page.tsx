
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import TreasurerDashboard from "@/components/dashboard/contributions/treasurer-dashboard";
import MemberDashboard from "@/components/dashboard/contributions/member-dashboard";
import { PersonalizedSuggestions } from "@/components/dashboard/personalized-suggestions";

interface UserProfile {
  role: string;
}

export default function ContributionsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!userProfile) {
    return <div>Could not load user profile.</div>;
  }
  
  if (userProfile.role === 'Treasurer') {
    return (
      <div className="space-y-6">
        <PersonalizedSuggestions />
        <TreasurerDashboard isReadOnly={false} />
      </div>
    );
  }

  if (userProfile.role === 'Chairperson') {
    return <TreasurerDashboard isReadOnly={true} />;
  }
  
  if (userProfile.role === 'Coordinator' || userProfile.role === 'Member' || userProfile.role === 'Investment Lead' || userProfile.role === 'Secretary' || userProfile.role === 'Vice Chairperson') {
    return <MemberDashboard userId={user!.uid} />;
  }

  // Fallback for any other roles or if logic gets complex
  return <MemberDashboard userId={user!.uid} />;
}
