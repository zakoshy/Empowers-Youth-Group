
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Expenditure } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export function ExpenditureView() {
  const firestore = useFirestore();
  const expendituresRef = useMemoFirebase(
    () => query(collection(firestore, 'expenditures'), orderBy('date', 'desc')),
    [firestore]
  );
  const { data: expenditures, isLoading } = useCollection<Expenditure>(expendituresRef);

  const totalExpenditure = expenditures?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Expenditure</CardTitle>
        <CardDescription>A record of all money spent by the group. Total spent: <span className='font-bold text-primary'>Ksh {totalExpenditure.toLocaleString()}</span></CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item/Service</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenditures && expenditures.length > 0 ? (
              expenditures.map((expenditure) => (
                <TableRow key={expenditure.id}>
                  <TableCell>
                    <div className="font-medium">{expenditure.title}</div>
                    <div className="text-sm text-muted-foreground">{expenditure.description}</div>
                  </TableCell>
                  <TableCell>{format(new Date(expenditure.date), 'PPP')}</TableCell>
                  <TableCell className="text-right">Ksh {expenditure.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No expenditures have been recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
