
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, updateDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
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
import { Loader2, Calendar as CalendarIcon, Trash2, Plus } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Poll } from './polls-widget';

interface PollFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  poll?: Poll | null;
}

const formSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters.'),
  options: z.array(z.object({ text: z.string().min(1, 'Option cannot be empty.') })).min(2, 'Must have at least two options.'),
  endDate: z.date({
    required_error: 'An end date is required.',
  }),
});

export function PollFormDialog({
  isOpen,
  onOpenChange,
  poll,
}: PollFormDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: poll
      ? { ...poll, options: poll.options.map(o => ({text: o.text})), endDate: new Date(poll.endDate) }
      : {
          question: '',
          options: [{ text: '' }, { text: '' }],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
        },
  });
  
  useEffect(() => {
    if (isOpen) {
        if (poll) {
            form.reset({
                question: poll.question,
                options: poll.options.map(o => ({ text: o.text })),
                endDate: new Date(poll.endDate),
            });
        } else {
            form.reset({
                question: '',
                options: [{ text: '' }, { text: '' }],
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
        }
    }
  }, [poll, isOpen, form]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to manage polls.'});
        return;
    }
    setIsSubmitting(true);
    try {
        if (poll) {
            // Update existing poll
            const pollRef = doc(firestore, 'polls', poll.id);
            const newOptions = values.options.map((opt, index) => ({
                id: poll.options[index]?.id || `opt${Date.now()}${index}`,
                text: opt.text,
                votes: poll.options[index]?.votes || 0,
            }));
            await updateDoc(pollRef, {
                question: values.question,
                options: newOptions,
                endDate: values.endDate.toISOString(),
            });
            toast({ title: 'Success!', description: 'Poll has been updated.'});

        } else {
            // Create new poll
            const pollData = {
                question: values.question,
                options: values.options.map((opt, index) => ({ id: `opt${index + 1}`, text: opt.text, votes: 0 })),
                startDate: new Date().toISOString(),
                endDate: values.endDate.toISOString(),
                creatorId: user.uid,
                voted: [],
            };
            await addDoc(collection(firestore, 'polls'), pollData);
            toast({ title: 'Success!', description: 'New poll has been created.' });
        }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save poll:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not save the poll. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{poll ? 'Edit Poll' : 'Create a New Poll'}</DialogTitle>
          <DialogDescription>
            {poll ? 'Update the details for your poll.' : 'Ask a question to the group and gather opinions.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poll Question</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., What should be our next team-building activity?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Options</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`options.${index}.text`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input placeholder={`Option ${index + 1}`} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ text: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
            </div>

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Poll End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
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
                        disabled={(date) => date < new Date()}
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
                {isSubmitting ? (poll ? 'Saving...' : 'Creating...') : (poll ? 'Save Changes' : 'Create Poll')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    