
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { Expenditure } from '@/lib/data';
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

interface ExpenditureListProps {
  onEdit: (expenditure: Expenditure) => void;
}

export function ExpenditureList({ onEdit }: ExpenditureListProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const expendituresRef = useMemoFirebase(
    () => query(collection(firestore, 'expenditures'), orderBy('date', 'desc')),
    [firestore]
  );
  const { data: expenditures, isLoading } = useCollection<Expenditure>(expendituresRef);
  
  const handleDelete = async (expenditureId: string) => {
    try {
      await deleteDoc(doc(firestore, 'expenditures', expenditureId));
      toast({
        title: "Expenditure Deleted",
        description: "The expenditure has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting expenditure: ", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the expenditure. Please try again.",
      });
    }
  };

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
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenditures && expenditures.length > 0 ? (
            expenditures.map((expenditure) => (
              <TableRow key={expenditure.id}>
                <TableCell className="font-medium">{expenditure.title}</TableCell>
                <TableCell>{format(new Date(expenditure.date), 'PPP')}</TableCell>
                <TableCell>Ksh {expenditure.amount.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(expenditure)}>
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
                          This action cannot be undone. This will permanently delete the expenditure.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(expenditure.id)}>
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
              <TableCell colSpan={4} className="text-center">
                No expenditures found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
