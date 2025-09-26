
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { format } from "date-fns"
import { Skeleton } from '../ui/skeleton';

interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
}

export function EventsWidget() {
  const firestore = useFirestore();
  const now = new Date().toISOString();

  const eventsRef = useMemoFirebase(() => query(
    collection(firestore, 'events'),
    where('date', '>=', now),
    orderBy('date', 'asc'),
    limit(3)
  ), [firestore, now]);

  const { data: events, isLoading } = useCollection<Event>(eventsRef);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Stay informed about group activities.</CardDescription>
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
            {events && events.length > 0 ? (
                events.map((event) => (
                    <div key={event.id} className="flex items-center gap-4">
                        <div className="bg-muted text-muted-foreground rounded-lg p-3 flex flex-col items-center justify-center w-16">
                            <span className="text-sm font-bold">{format(new Date(event.date), 'MMM')}</span>
                            <span className="text-xl font-bold">{format(new Date(event.date), 'd')}</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-sm text-muted-foreground">{event.location}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center">No upcoming events scheduled.</p>
            )}
            </div>
        )}
      </CardContent>
    </Card>
  )
}

    