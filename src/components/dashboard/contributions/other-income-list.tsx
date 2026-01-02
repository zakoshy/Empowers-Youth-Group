
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { MiscellaneousIncome } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface OtherIncomeListProps {
  onEdit: (income: MiscellaneousIncome) => void;
}

export function OtherIncomeList({ onEdit }: OtherIncomeListProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const incomesRef = useMemoFirebase(
    () => query(collection(firestore, 'miscellaneousIncomes'), orderBy('date', 'desc')),
    [firestore]
  );
  const { data: incomes, isLoading } = useCollection<MiscellaneousIncome>(incomesRef);
  
  const handleDelete = async (incomeId: string) => {
    try {
      await deleteDoc(doc(firestore, 'miscellaneousIncomes', incomeId));
      toast({
        title: "Income Record Deleted",
        description: "The record has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting income record: ", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the record. Please try again.",
      });
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'Registration Fee':
        return 'default';
      case 'Fine':
        return 'destructive';
      case 'Loan Interest':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incomes && incomes.length > 0 ? (
            incomes.map((income) => (
              <TableRow key={income.id}>
                <TableCell>
                    <Badge variant={getBadgeVariant(income.type)}>{income.type}</Badge>
                </TableCell>
                <TableCell className="font-medium">{income.description}</TableCell>
                <TableCell>{format(new Date(income.date), 'PPP')}</TableCell>
                <TableCell>Ksh {income.amount.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(income)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this income record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(income.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No income records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
