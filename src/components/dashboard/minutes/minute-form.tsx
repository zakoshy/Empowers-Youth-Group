'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { CldUploadButton } from 'next-cloudinary';
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
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon, Upload, FileText, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { MeetingMinute } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface MinuteFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  minute?: MeetingMinute | null;
}

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  meetingDate: z.date({ required_error: 'A date is required.' }),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
}).refine(data => !!data.content || !!data.fileUrl, {
  message: 'Either minute content or a file upload is required.',
  path: ['content'], // you can associate the error with a specific field
});

export function MinuteFormDialog({ isOpen, onOpenChange, minute }: MinuteFormDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      meetingDate: new Date(),
      content: '',
      fileUrl: '',
      fileName: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (minute) {
        form.reset({
          title: minute.title || '',
          meetingDate: minute.meetingDate ? new Date(minute.meetingDate) : new Date(),
          content: minute.content || '',
          fileUrl: minute.fileUrl || '',
          fileName: minute.fileName || '',
        });
      } else {
        form.reset({
          title: '',
          meetingDate: new Date(),
          content: '',
          fileUrl: '',
          fileName: '',
        });
      }
    }
  }, [minute, isOpen, form]);

  const handleUploadSuccess = (result: any) => {
    const uploadedFileUrl = result?.info?.secure_url;
    const uploadedFileName = result?.info?.original_filename;
    
    if (uploadedFileUrl && uploadedFileName) {
      form.setValue('fileUrl', uploadedFileUrl, { shouldValidate: true });
      form.setValue('fileName', uploadedFileName, { shouldValidate: true });
      form.setValue('content', '', { shouldValidate: true }); // Clear content if file is uploaded
    }
    setIsUploading(false);
    toast({ title: 'Upload complete!', description: 'Your file is ready to be saved.' });
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    form.setValue('content', e.target.value, { shouldValidate: true });
    if (e.target.value) {
      form.setValue('fileUrl', '', { shouldValidate: true });
      form.setValue('fileName', '', { shouldValidate: true });
    }
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const minuteData = {
        ...values,
        meetingDate: values.meetingDate.toISOString(),
        uploadDate: new Date().toISOString(),
        uploadedBy: user.uid,
      };

      if (minute) {
        const minuteRef = doc(firestore, 'meetingMinutes', minute.id);
        await updateDoc(minuteRef, minuteData);
        toast({ title: 'Success!', description: 'Meeting minute has been updated.' });
      } else {
        await addDoc(collection(firestore, 'meetingMinutes'), minuteData);
        toast({ title: 'Success!', description: 'New meeting minute has been uploaded.' });
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save minute:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Could not save the minute.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const watchedFileName = form.watch('fileName');
  const watchedContent = form.watch('content');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
       <DialogContent
        className="sm:max-w-[625px]"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.cloudinary-widget')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{minute ? 'Edit Minute' : 'Upload New Minute'}</DialogTitle>
           <DialogDescription>
            Fill in the details below. You can either type the minutes directly or upload a document.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minute Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., August 2024 General Meeting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="meetingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Meeting</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          disabled={isUploading}
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
                        captionLayout="dropdown-nav"
                        fromYear={2020}
                        toYear={new Date().getFullYear()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
             <Tabs defaultValue={minute?.content ? "type" : "upload"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="type">Type Minutes</TabsTrigger>
                <TabsTrigger value="upload">Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="type">
                 <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Minute Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Type or paste the meeting minutes here..."
                            className="min-h-[200px] mt-2"
                            {...field}
                            onChange={handleContentChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </TabsContent>
              <TabsContent value="upload">
                <div className="mt-2">
                  {watchedFileName ? (
                    <div className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="truncate">{watchedFileName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="h-6 w-6"
                        onClick={() => {
                            form.setValue('fileUrl', '', {shouldValidate: true});
                            form.setValue('fileName', '', {shouldValidate: true});
                        }}
                        disabled={isUploading || isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <CldUploadButton
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
                        options={{ multiple: false, sources: ['local'] }}
                        onSuccess={handleUploadSuccess}
                        onUploadAdded={() => setIsUploading(true)}
                    >
                      <div
                        className={cn(
                          buttonVariants({ variant: 'outline' }),
                          'w-full flex items-center cursor-pointer',
                          (isUploading || isSubmitting) && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {isUploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {isUploading ? 'Uploading...' : 'Upload Document'}
                      </div>
                    </CldUploadButton>
                  )}
                  {form.formState.errors.content && (
                     <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.content.message}</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isUploading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || isUploading || (!watchedContent && !watchedFileName)}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Minute'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    