'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { MeetingMinute } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Download, FileText } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MinutesList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const minutesRef = useMemoFirebase(
    () => query(collection(firestore, 'meetingMinutes'), orderBy('meetingDate', 'desc')),
    [firestore]
  );
  const { data: minutes, isLoading } = useCollection<MeetingMinute>(minutesRef);

  const [editingMinute, setEditingMinute] = useState<MeetingMinute | null>(null);
  const [viewingMinute, setViewingMinute] = useState<MeetingMinute | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const handleEdit = (minute: MeetingMinute) => {
    setEditingMinute(minute);
    setIsFormOpen(true);
  };

  const handleView = (minute: MeetingMinute) => {
    setViewingMinute(minute);
    setIsViewOpen(true);
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
            <TableHead>Format</TableHead>
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
                  {minute.fileUrl ? (
                     <span className="flex items-center gap-1 text-sm text-muted-foreground"><Download className="h-4 w-4" /> Document</span>
                  ) : (
                     <span className="flex items-center gap-1 text-sm text-muted-foreground"><FileText className="h-4 w-4" /> Typed Text</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {minute.fileUrl ? (
                     <Button variant="outline" size="sm" asChild>
                       <a href={minute.fileUrl} target="_blank" rel="noopener noreferrer" download={minute.fileName}>
                         Download
                       </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleView(minute)}>
                      View
                    </Button>
                  )}
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

      {viewingMinute && (
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewingMinute.title}</DialogTitle>
              <DialogDescription>
                Meeting held on {format(new Date(viewingMinute.meetingDate), 'PPP')}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-96 w-full">
                <div className="prose dark:prose-invert max-w-none p-4 whitespace-pre-wrap">
                  {viewingMinute.content}
                </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    