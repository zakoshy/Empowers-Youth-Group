'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download } from 'lucide-react';
import { format } from "date-fns";
import { Button } from '../ui/button';
import type { MeetingMinute } from '@/lib/data';

export function MinutesWidget() {
  const firestore = useFirestore();

  const minutesRef = useMemoFirebase(() => query(
    collection(firestore, 'meetingMinutes'),
    orderBy('meetingDate', 'desc'),
    limit(5)
  ), [firestore]);

  const { data: minutes, isLoading } = useCollection<MeetingMinute>(minutesRef);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Meeting Minutes</CardTitle>
        <CardDescription>Review the latest official records.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        ) : (
            <div className="space-y-4">
            {minutes && minutes.length > 0 ? (
                minutes.map((minute) => (
                    <div key={minute.id} className="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                            <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold truncate">{minute.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    Meeting Date: {format(new Date(minute.meetingDate), 'MMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                           <a href={minute.fileUrl} target="_blank" rel="noopener noreferrer" download={minute.fileName}>
                             <Download className="h-4 w-4" />
                           </a>
                        </Button>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No meeting minutes have been uploaded yet.</p>
            )}
            </div>
        )}
      </CardContent>
    </Card>
  )
}

    