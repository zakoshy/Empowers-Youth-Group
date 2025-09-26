'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MONTHS } from '@/lib/data';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
}

interface AddSpecialContributionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  member: UserProfile;
  month: number;
  year: number;
}

const formSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  description: z.string().min(3, 'Description is required.').max(100),
});

export function AddSpecialContributionDialog({
  isOpen,
  onOpenChange,
  member,
  month,
  year,
}: AddSpecialContributionDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const specialContributionsRef = collection(
        firestore,
        'userProfiles',
        member.id,
        'specialContributions'
      );
      
      const docData = {
          userId: member.id,
          financialYearId: year.toString(),
          date: new Date().toISOString(),
          amount: values.amount,
          description: values.description,
          month: month,
          year: year
      }

      await addDoc(specialContributionsRef, docData);

      toast({
        title: 'Success!',
        description: `Miniharambee for ${member.firstName} has been recorded.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add special contribution:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not record the contribution. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Miniharambee</DialogTitle>
          <DialogDescription>
            Record a special contribution for {member.firstName} {member.lastName} for the month of {MONTHS[month]}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (Ksh)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1000" {...field} />
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
                    <Textarea placeholder="e.g., Guest of honor contribution" {...field} />
                  </FormControl>
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
                {isSubmitting ? 'Recording...' : 'Record Contribution'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
