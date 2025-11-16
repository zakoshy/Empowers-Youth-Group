
'use client';

import { useMemo, useEffect, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, collectionGroup, doc, query, where, getDocs, Firestore } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Lock } from 'lucide-react';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  role: string;
}

interface Contribution {
  userId: string;
  amount: number;
  year: number;
}

interface SharesData {
    memberShares: (UserProfile & { totalContribution: number; sharePercentage: number })[];
    grandTotal: number;
}

const getInitials = (firstName = '', lastName = '') => {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
};

const currentYear = new Date().getFullYear();

async function fetchAllDataForShares(firestore: Firestore): Promise<SharesData> {
    const usersQuery = query(collection(firestore, 'userProfiles'), where('role', '!=', 'Admin'));
    const contributionsQuery = query(collectionGroup(firestore, 'contributions'), where('year', '==', currentYear));
    const specialContributionsQuery = query(collectionGroup(firestore, 'specialContributions'), where('year', '==', currentYear));

    const [usersSnapshot, contributionsSnapshot, specialContributionsSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(contributionsQuery),
        getDocs(specialContributionsQuery)
    ]);

    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    const contributions = contributionsSnapshot.docs.map(doc => doc.data() as Contribution);
    const specialContributions = specialContributionsSnapshot.docs.map(doc => doc.data() as Contribution);

    const monthlyTotal = contributions.reduce((sum, c) => sum + c.amount, 0);
    const specialTotal = specialContributions.reduce((sum, sc) => sum + sc.amount, 0);
    const grandTotal = monthlyTotal + specialTotal;

    if (grandTotal === 0) {
      return {
        memberShares: users.map(u => ({
          ...u,
          totalContribution: 0,
          sharePercentage: 0,
        })),
        grandTotal: 0,
      };
    }
    
    const memberTotals: Record<string, number> = {};

    contributions.forEach(c => {
        memberTotals[c.userId] = (memberTotals[c.userId] || 0) + c.amount;
    });

    specialContributions.forEach(sc => {
        memberTotals[sc.userId] = (memberTotals[sc.userId] || 0) + sc.amount;
    });

    const memberShares = users.map(user => {
      const totalContribution = memberTotals[user.id] || 0;
      const sharePercentage = (totalContribution / grandTotal) * 100;
      return {
        ...user,
        totalContribution,
        sharePercentage,
      };
    }).sort((a, b) => b.sharePercentage - a.sharePercentage);

    return { memberShares, grandTotal };
}

export default function SharesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [sharesData, setSharesData] = useState<SharesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user's profile to check their role
  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'userProfiles', user.uid) : null), [firestore, user]);
  const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const isAdmin = currentUserProfile?.role === 'Admin';

  useEffect(() => {
    // Only proceed if we are done loading the user and their profile, and they are an admin.
    if (!isUserLoading && !isProfileLoading && firestore) {
      if (isAdmin) {
        setIsLoading(true);
        fetchAllDataForShares(firestore)
          .then(data => {
            setSharesData(data);
            setError(null);
          })
          .catch(err => {
            console.error("Error fetching shares data:", err);
            setError("Failed to fetch member shares data.");
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Not an admin, stop loading and show access denied.
        setIsLoading(false);
      }
    }
  }, [isUserLoading, isProfileLoading, isAdmin, firestore]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>This page is restricted to administrators.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">You do not have permission to view member shares.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Something went wrong.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{error}</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Shares - {currentYear}</CardTitle>
        <CardDescription>
          An overview of each member's contribution share for the current year. Total collected funds: <span className="font-bold text-primary">Ksh {sharesData?.grandTotal.toLocaleString() ?? 0}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Member</TableHead>
              <TableHead>Total Contribution</TableHead>
              <TableHead className="w-[300px]">Share Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sharesData && sharesData.memberShares.length > 0 ? (
                sharesData.memberShares.map(member => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.photoURL} />
                      <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{member.firstName} {member.lastName}</div>
                  </div>
                </TableCell>
                <TableCell>Ksh {member.totalContribution.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Progress value={member.sharePercentage} className="w-40" />
                    <span className="text-sm font-medium">{member.sharePercentage.toFixed(2)}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))
            ) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center">
                        No contribution data available for the current year.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
