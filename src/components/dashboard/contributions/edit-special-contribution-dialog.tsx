
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
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
import type { SpecialContribution } from './treasurer-dashboard';

interface EditSpecialContributionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  contribution: SpecialContribution;
}

const formSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  description: z.string().min(3, 'Description is required.').max(100),
});

export function EditSpecialContributionDialog({
  isOpen,
  onOpenChange,
  contribution,
}: EditSpecialContributionDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: contribution.amount,
      description: contribution.description,
    },
  });

  useEffect(() => {
    form.reset({
        amount: contribution.amount,
        description: contribution.description,
    })
  }, [contribution, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
        const docRef = doc(firestore, 'userProfiles', contribution.userId, 'specialContributions', contribution.id);
        
        await updateDoc(docRef, {
            amount: values.amount,
            description: values.description
        });

      toast({
        title: 'Success!',
        description: `The special contribution has been updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update special contribution:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the contribution. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Miniharambee</DialogTitle>
          <DialogDescription>
            Update the amount or description for this special contribution.
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
                    <Input type="number" {...field} />
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
                    <Textarea {...field} />
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
