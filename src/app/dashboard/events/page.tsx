
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EventFormDialog } from '@/components/dashboard/events/event-form';
import { EventList } from '@/components/dashboard/events/event-list';

export default function ManageEventsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Events</CardTitle>
            <CardDescription>Create, update, and manage all group events.</CardDescription>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>Add New Event</Button>
        </CardHeader>
        <CardContent>
          <EventList onEdit={(event) => { /* Logic to open edit form can be added here */ }} />
        </CardContent>
      </Card>
      
      <EventFormDialog 
        isOpen={isFormOpen} 
        onOpenChange={setIsFormOpen} 
      />
    </div>
  );
}
