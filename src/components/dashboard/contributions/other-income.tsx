'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MiscellaneousIncome, UserProfile } from '@/lib/data';
import { OtherIncomeFormDialog } from './other-income-form';
import { OtherIncomeList } from './other-income-list';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle } from 'lucide-react';

interface OtherIncomeProps {
  members: UserProfile[];
  isReadOnly: boolean;
}

export function OtherIncome({ members, isReadOnly }: OtherIncomeProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<MiscellaneousIncome | null>(null);
  const [incomeTypeToAdd, setIncomeTypeToAdd] = useState<'Fine' | 'Loan Interest' | 'Registration Fee'>('Fine');

  const handleEdit = (income: MiscellaneousIncome) => {
    setEditingIncome(income);
    setIsFormOpen(true);
  };

  const handleAddNew = (type: 'Fine' | 'Loan Interest' | 'Registration Fee') => {
      setEditingIncome(null);
      setIncomeTypeToAdd(type);
      setIsFormOpen(true);
  }

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
            <CardTitle>{isReadOnly ? 'Other Income' : 'Manage Other Income'}</CardTitle>
            <CardDescription>
                {isReadOnly ? 'A summary of registration fees, fines, and loan interest.' : 'Record registration fees, fines, and loan interest.'}
            </CardDescription>
          </div>
          {!isReadOnly && (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Income
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Income Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleAddNew('Fine')}>Fine</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleAddNew('Loan Interest')}>Loan Interest</DropdownMenuItem>
                <DropdownMenuItem disabled>
                    Registration Fee (Automatic)
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          <OtherIncomeList onEdit={handleEdit} isReadOnly={isReadOnly} />
        </CardContent>
      </Card>
      
      {!isReadOnly && (
        <OtherIncomeFormDialog 
            isOpen={isFormOpen} 
            onOpenChange={handleOpenChange}
            income={editingIncome}
            members={members}
            initialType={incomeTypeToAdd}
        />
      )}
    </div>
  );
}
