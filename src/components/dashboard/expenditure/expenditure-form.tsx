
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import type { Expenditure } from '@/lib/data';

interface ExpenditureFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  expenditure?: Expenditure | null;
}

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  date: z.date({
    required_error: 'A date is required.',
  }),
});

export function ExpenditureFormDialog({
  isOpen,
  onOpenChange,
  expenditure,
}: ExpenditureFormDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: expenditure
      ? { ...expenditure, date: new Date(expenditure.date) }
      : {
          title: '',
          description: '',
          amount: 0,
          date: new Date(),
        },
  });

  useEffect(() => {
    if (isOpen) {
      if (expenditure) {
        form.reset({
          title: expenditure.title,
          description: expenditure.description,
          amount: expenditure.amount,
          date: new Date(expenditure.date),
        });
      } else {
          form.reset({
              title: '',
              description: '',
              amount: 0,
              date: new Date(),
          })
      }
    }
  }, [expenditure, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const expenditureData = {
        ...values,
        date: values.date.toISOString(),
        recordedBy: user.uid,
      };

      if (expenditure) {
        const expenditureRef = doc(firestore, 'expenditures', expenditure.id);
        await updateDoc(expenditureRef, expenditureData);
        toast({ title: 'Success!', description: 'Expenditure has been updated.' });
      } else {
        await addDoc(collection(firestore, 'expenditures'), expenditureData);
        toast({ title: 'Success!', description: 'New expenditure has been recorded.' });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save expenditure:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not save the expenditure. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expenditure ? 'Edit Expenditure' : 'Add New Expenditure'}</DialogTitle>
          <DialogDescription>
            {expenditure ? 'Update the details for this expenditure.' : 'Fill in the details for the new expenditure.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Purchase of stationery" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of what was purchased..." {...field} />
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
                  <FormLabel>Date of Expenditure</FormLabel>
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
                {isSubmitting ? 'Saving...' : 'Save Expenditure'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
