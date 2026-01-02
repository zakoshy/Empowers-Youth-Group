
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { MiscellaneousIncome, UserProfile } from '@/lib/data';
import { OtherIncomeFormDialog } from './other-income-form';
import { OtherIncomeList } from './other-income-list';

interface OtherIncomeProps {
  members: UserProfile[];
}

export function OtherIncome({ members }: OtherIncomeProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<MiscellaneousIncome | null>(null);

  const handleEdit = (income: MiscellaneousIncome) => {
    setEditingIncome(income);
    setIsFormOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditingIncome(null);
    }
    setIsFormOpen(open);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Other Income</CardTitle>
            <CardDescription>Record registration fees, fines, and loan interest.</CardDescription>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>Add Income</Button>
        </CardHeader>
        <CardContent>
          <OtherIncomeList onEdit={handleEdit} />
        </CardContent>
      </Card>
      
      <OtherIncomeFormDialog 
        isOpen={isFormOpen} 
        onOpenChange={handleOpenChange}
        income={editingIncome}
        members={members}
      />
    </div>
  );
}
