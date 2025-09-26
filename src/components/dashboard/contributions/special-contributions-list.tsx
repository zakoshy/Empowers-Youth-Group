
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useAllUsers } from '@/hooks/use-all-users';

interface SpecialContribution {
  id: string;
  userId: string;
  date: string;
  amount: number;
  description: string;
}

export function SpecialContributionsList() {
  const firestore = useFirestore();
  const { users, isLoading: usersLoading, userRole } = useAllUsers();

  const shouldFetchData = userRole === 'Treasurer';

  const specialContributionsRef = useMemoFirebase(
    () => (shouldFetchData ? query(collectionGroup(firestore, 'specialContributions'), orderBy('date', 'desc')) : null),
    [firestore, shouldFetchData]
  );

  const { data: contributions, isLoading: contributionsLoading } =
    useCollection<SpecialContribution>(specialContributionsRef);

  const isLoading = (usersLoading || contributionsLoading) && shouldFetchData;

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown Member';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Special Contributions</CardTitle>
        <CardDescription>A log of all miniharambees recorded.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions && contributions.length > 0 ? (
                contributions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{getUserName(c.userId)}</TableCell>
                    <TableCell>{format(new Date(c.date), 'PP')}</TableCell>
                    <TableCell>{c.description}</TableCell>
                    <TableCell className="text-right">Ksh {c.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    {shouldFetchData ? 'No special contributions found.' : 'You do not have permission to view this data.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
