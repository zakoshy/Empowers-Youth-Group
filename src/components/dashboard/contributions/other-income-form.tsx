
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MiscellaneousIncome, UserProfile } from '@/lib/data';

interface OtherIncomeFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  income?: MiscellaneousIncome | null;
  members: UserProfile[];
  initialType?: 'Registration Fee' | 'Fine' | 'Loan Interest';
}

const formSchema = z.object({
  type: z.enum(['Registration Fee', 'Fine', 'Loan Interest']),
  description: z.string().min(3, 'Description must be at least 3 characters.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  date: z.date({
    required_error: 'A date is required.',
  }),
  memberId: z.string().optional(),
});

export function OtherIncomeFormDialog({
  isOpen,
  onOpenChange,
  income,
  members,
  initialType
}: OtherIncomeFormDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        type: 'Fine',
        description: '',
        amount: 0,
        date: new Date(),
        memberId: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (income) {
        form.reset({
          type: income.type,
          description: income.description,
          amount: income.amount,
          date: new Date(income.date),
          memberId: income.memberId,
        });
      } else {
          form.reset({
              type: initialType || 'Fine',
              description: '',
              amount: 0,
              date: new Date(),
              memberId: undefined,
          });
      }
    }
  }, [income, isOpen, form, initialType]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const incomeData = {
        ...values,
        date: values.date.toISOString(),
        recordedBy: user.uid,
      };

      if (income) {
        const incomeRef = doc(firestore, 'miscellaneousIncomes', income.id);
        await updateDoc(incomeRef, incomeData);
        toast({ title: 'Success!', description: 'Income record has been updated.' });
      } else {
        await addDoc(collection(firestore, 'miscellaneousIncomes'), incomeData);
        toast({ title: 'Success!', description: 'New income has been recorded.' });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save income record:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not save the income record. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const incomeType = form.watch('type');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{income ? 'Edit Income Record' : 'Add New Income'}</DialogTitle>
          <DialogDescription>
            {income ? 'Update the details for this income record.' : 'Fill in the details for the new income source.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Income Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an income type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Fine">Fine</SelectItem>
                                <SelectItem value="Loan Interest">Loan Interest</SelectItem>
                                <SelectItem value="Registration Fee" disabled>Registration Fee (Automatic)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {(incomeType === 'Registration Fee' || incomeType === 'Fine') && (
                 <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Select Member</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select the relevant member" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {members.map(member => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.firstName} {member.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Late contribution fine for May" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (Ksh)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Received</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Record'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
