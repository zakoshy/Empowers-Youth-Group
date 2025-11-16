
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, collectionGroup, doc, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Lock, Scale } from 'lucide-react';

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
}

const getInitials = (firstName = '', lastName = '') => {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
};

export default function SharesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // Get current user's profile to check their role
  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'userProfiles', user.uid) : null), [firestore, user]);
  const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isAdmin = currentUserProfile?.role === 'Admin';

  // Fetch all users
  const usersRef = useMemoFirebase(() => (isAdmin ? collection(firestore, 'userProfiles') : null), [isAdmin, firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<UserProfile>(usersRef);

  // Fetch all contributions via collection group query
  const contributionsRef = useMemoFirebase(() => (isAdmin ? query(collectionGroup(firestore, 'contributions')) : null), [isAdmin, firestore]);
  const { data: contributions, isLoading: areContributionsLoading } = useCollection<Contribution>(contributionsRef);

  // Fetch all special contributions via collection group query
  const specialContributionsRef = useMemoFirebase(() => (isAdmin ? query(collectionGroup(firestore, 'specialContributions')) : null), [isAdmin, firestore]);
  const { data: specialContributions, isLoading: areSpecialContributionsLoading } = useCollection<Contribution>(specialContributionsRef);

  const isLoading = isUserLoading || isProfileLoading || areUsersLoading || areContributionsLoading || areSpecialContributionsLoading;

  const sharesData = useMemo(() => {
    if (!users || !contributions || !specialContributions) {
      return { memberShares: [], grandTotal: 0 };
    }

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

    const memberShares = users.filter(u => u.role !== 'Admin').map(user => {
      const totalContribution = memberTotals[user.id] || 0;
      const sharePercentage = (totalContribution / grandTotal) * 100;
      return {
        ...user,
        totalContribution,
        sharePercentage,
      };
    }).sort((a, b) => b.sharePercentage - a.sharePercentage);


    return { memberShares, grandTotal };
  }, [users, contributions, specialContributions]);


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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Shares</CardTitle>
        <CardDescription>
          An overview of each member's contribution share in the group. Total collected funds: <span className="font-bold text-primary">Ksh {sharesData.grandTotal.toLocaleString()}</span>.
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
            {sharesData.memberShares.map(member => (
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
