'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { InvestmentReport } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Download, FileText } from 'lucide-react';
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

export function ReportsList() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const reportsRef = useMemoFirebase(
    () => query(collection(firestore, 'investmentReports'), orderBy('uploadDate', 'desc')),
    [firestore]
  );
  const { data: reports, isLoading } = useCollection<InvestmentReport>(reportsRef);


  const handleEdit = (reportId: string) => {
    router.push(`/dashboard/reports/new?id=${reportId}`);
  };
  
  const handleDelete = async (reportId: string) => {
    try {
      await deleteDoc(doc(firestore, 'investmentReports', reportId));
      toast({
        title: "Report Deleted",
        description: "The investment report has been removed.",
      });
    } catch (error) {
      console.error("Error deleting report: ", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the report. Please try again.",
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
            <TableHead>Upload Date</TableHead>
            <TableHead>Format</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports && reports.length > 0 ? (
            reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.title}</TableCell>
                <TableCell>{format(new Date(report.uploadDate), 'PPP')}</TableCell>
                <TableCell>
                  {report.fileUrl ? (
                     <span className="flex items-center gap-1 text-sm text-muted-foreground"><Download className="h-4 w-4" /> Document</span>
                  ) : (
                     <span className="flex items-center gap-1 text-sm text-muted-foreground"><FileText className="h-4 w-4" /> Typed Text</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {report.fileUrl ? (
                     <Button variant="outline" size="sm" asChild>
                       <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" download={report.fileName}>
                         Download
                       </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                       <a href={`/dashboard/reports/view?id=${report.id}`} target="_blank" rel="noopener noreferrer">
                         View
                       </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(report.id)}>
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
                          This action cannot be undone. This will permanently delete the investment report.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(report.id)}>
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
                No investment reports found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
