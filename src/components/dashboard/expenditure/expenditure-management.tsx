
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenditureFormDialog } from './expenditure-form';
import { ExpenditureList } from './expenditure-list';
import type { Expenditure } from '@/lib/data';

export function ExpenditureManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpenditure, setEditingExpenditure] = useState<Expenditure | null>(null);

  const handleEdit = (expenditure: Expenditure) => {
    setEditingExpenditure(expenditure);
    setIsFormOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditingExpenditure(null);
    }
    setIsFormOpen(open);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Expenditure</CardTitle>
            <CardDescription>Record, update, and track all group expenditures.</CardDescription>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>Add Expenditure</Button>
        </CardHeader>
        <CardContent>
          <ExpenditureList onEdit={handleEdit} />
        </CardContent>
      </Card>
      
      <ExpenditureFormDialog 
        isOpen={isFormOpen} 
        onOpenChange={handleOpenChange}
        expenditure={editingExpenditure}
      />
    </div>
  );
}
