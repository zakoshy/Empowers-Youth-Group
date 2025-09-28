'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { MeetingMinute } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { MinuteFormDialog } from './minute-form';
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

export function MinutesList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const minutesRef = useMemoFirebase(
    () => query(collection(firestore, 'meetingMinutes'), orderBy('meetingDate', 'desc')),
    [firestore]
  );
  const { data: minutes, isLoading } = useCollection<MeetingMinute>(minutesRef);

  const [editingMinute, setEditingMinute] = useState<MeetingMinute | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (minute: MeetingMinute) => {
    setEditingMinute(minute);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (minuteId: string) => {
    try {
      await deleteDoc(doc(firestore, 'meetingMinutes', minuteId));
      toast({
        title: "Minute Deleted",
        description: "The meeting minute has been removed.",
      });
    } catch (error) {
      console.error("Error deleting minute: ", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the minute. Please try again.",
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
            <TableHead>Meeting Date</TableHead>
            <TableHead>File</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {minutes && minutes.length > 0 ? (
            minutes.map((minute) => (
              <TableRow key={minute.id}>
                <TableCell className="font-medium">{minute.title}</TableCell>
                <TableCell>{format(new Date(minute.meetingDate), 'PPP')}</TableCell>
                <TableCell>
                  <Button variant="link" asChild className="p-0 h-auto">
                    <a href={minute.fileUrl} target="_blank" rel="noopener noreferrer" download={minute.fileName}>
                      {minute.fileName}
                    </a>
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(minute)}>
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
                          This action cannot be undone. This will permanently delete the meeting minute.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(minute.id)}>
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
                No meeting minutes found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {editingMinute && (
        <MinuteFormDialog
          isOpen={isFormOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingMinute(null);
            }
            setIsFormOpen(open);
          }}
          minute={editingMinute}
        />
      )}
    </>
  );
}

    