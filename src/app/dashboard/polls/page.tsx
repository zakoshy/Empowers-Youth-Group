
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PollFormDialog } from '@/components/dashboard/poll-form';
import { PollsWidget } from '@/components/dashboard/polls-widget';

export default function ManagePollsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Group Polls</CardTitle>
            <CardDescription>Create a new poll, vote on active ones, or view results.</CardDescription>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>Create New Poll</Button>
        </CardHeader>
        <CardContent>
          <PollsWidget />
        </CardContent>
      </Card>
      
      <PollFormDialog 
        isOpen={isFormOpen} 
        onOpenChange={setIsFormOpen} 
      />
    </div>
  );
}

    