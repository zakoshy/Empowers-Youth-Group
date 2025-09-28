
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

interface MinuteFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  minute?: MeetingMinute | null;
}

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  meetingDate: z.date({ required_error: 'A date is required.' }),
  fileUrl: z.string().min(1, 'A file must be uploaded.'),
  fileName: z.string().min(1, 'File name is required.'),
});

export function MinuteFormDialog({ isOpen, onOpenChange, minute }: MinuteFormDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: minute
      ? { ...minute, meetingDate: new Date(minute.meetingDate) }
      : {
          title: '',
          meetingDate: new Date(),
          fileUrl: '',
          fileName: '',
        },
  });
  
  const [fileUrl, setFileUrl] = useState(minute?.fileUrl || '');
  const [fileName, setFileName] = useState(minute?.fileName || '');


  useEffect(() => {
    if (isOpen) {
        if (minute) {
            form.reset({
                ...minute,
                meetingDate: new Date(minute.meetingDate)
            });
            setFileUrl(minute.fileUrl);
            setFileName(minute.fileName);
        } else {
            form.reset({
                title: '',
                meetingDate: new Date(),
                fileUrl: '',
                fileName: '',
            });
            setFileUrl('');
            setFileName('');
        }
    }
  }, [minute, isOpen, form]);

  const handleUploadSuccess = (result: any) => {
    const uploadedFileUrl = result?.info?.secure_url;
    const uploadedFileName = result?.info?.original_filename;
    
    if (uploadedFileUrl && uploadedFileName) {
      setFileUrl(uploadedFileUrl);
      setFileName(uploadedFileName);
      form.setValue('fileUrl', uploadedFileUrl, { shouldValidate: true });
      form.setValue('fileName', uploadedFileName, { shouldValidate: true });
    }
    setIsUploading(false);
    toast({ title: 'Upload complete!', description: 'Your file is ready to be saved.' });
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{minute ? 'Edit Minute' : 'Upload New Minute'}</DialogTitle>
          <DialogDescription>
            {minute ? 'Update the details for this meeting minute.' : 'Fill in the details and upload the minute document.'}
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

            <div className="space-y-2">
                <FormLabel>Document File</FormLabel>
                <div>
                  {fileUrl ? (
                    <div className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="truncate">{fileName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        type="button"
                        onClick={() => {
                            setFileUrl('');
                            setFileName('');
                            form.setValue('fileUrl', '');
                            form.setValue('fileName', '');
                        }}
                        disabled={isUploading || isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <CldUploadButton
                      options={{ multiple: false, sources: ['local'] }}
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      onSuccess={handleUploadSuccess}
                      onUploadAdded={() => {
                        setIsUploading(true);
                        toast({ title: "Uploading...", description: "Your file is being uploaded." });
                      }}
                      disabled={isUploading}
                    >
                      <div className={cn(
                          buttonVariants({ variant: 'outline' }),
                          'w-full flex items-center cursor-pointer',
                          (isUploading || isSubmitting) && 'opacity-50 cursor-not-allowed'
                      )}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isUploading ? 'Uploading...' : 'Upload Document'}
                      </div>
                    </CldUploadButton>
                  )}
                </div>
                <FormMessage>{form.formState.errors.fileUrl?.message}</FormMessage>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isUploading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || isUploading}>
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
