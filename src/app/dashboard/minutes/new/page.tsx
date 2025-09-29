'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { CldUploadButton } from 'next-cloudinary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon, Upload, FileText, X, ArrowLeft } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { MeetingMinute } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  meetingDate: z.date({ required_error: 'A date is required.' }),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
}).refine(data => !!data.content || !!data.fileUrl, {
  message: 'Either minute content or a file upload is required.',
  path: ['content'],
});

function MinuteFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const minuteId = searchParams.get('id');
  
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const minuteRef = useMemoFirebase(() => minuteId ? doc(firestore, 'meetingMinutes', minuteId) : null, [firestore, minuteId]);
  const { data: minuteData, isLoading: isMinuteLoading } = useDoc<MeetingMinute>(minuteRef);

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
    if (minuteData) {
      form.reset({
        title: minuteData.title || '',
        meetingDate: minuteData.meetingDate ? new Date(minuteData.meetingDate) : new Date(),
        content: minuteData.content || '',
        fileUrl: minuteData.fileUrl || '',
        fileName: minuteData.fileName || '',
      });
    } else if (!minuteId) {
        form.reset({
            title: '',
            meetingDate: new Date(),
            content: '',
            fileUrl: '',
            fileName: '',
        });
    }
  }, [minuteData, minuteId, form]);

  const handleUploadSuccess = (result: any) => {
    const uploadedFileUrl = result?.info?.secure_url;
    const uploadedFileName = result?.info?.original_filename;
    
    if (uploadedFileUrl && uploadedFileName) {
      form.setValue('fileUrl', uploadedFileUrl, { shouldValidate: true });
      form.setValue('fileName', uploadedFileName, { shouldValidate: true });
      form.setValue('content', '', { shouldValidate: true });
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
      const minuteDataToSave = {
        ...values,
        meetingDate: values.meetingDate.toISOString(),
        uploadDate: new Date().toISOString(),
        uploadedBy: user.uid,
      };

      if (minuteId) {
        const minuteRef = doc(firestore, 'meetingMinutes', minuteId);
        await updateDoc(minuteRef, minuteDataToSave);
        toast({ title: 'Success!', description: 'Meeting minute has been updated.' });
      } else {
        await addDoc(collection(firestore, 'meetingMinutes'), minuteDataToSave);
        toast({ title: 'Success!', description: 'New meeting minute has been uploaded.' });
      }
      
      router.push('/dashboard/minutes');
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
  
  if (isMinuteLoading && minuteId) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-40 w-full" />
              </CardContent>
          </Card>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{minuteId ? 'Edit Minute' : 'Upload New Minute'}</CardTitle>
            <CardDescription>
              Fill in the details below. You can either type the minutes directly or upload a document.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            
            <Tabs defaultValue={minuteData?.content ? "type" : "upload"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="type" disabled={!!watchedFileName}>Type Minutes</TabsTrigger>
                <TabsTrigger value="upload" disabled={!!watchedContent}>Upload File</TabsTrigger>
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
                        options={{ multiple: false, sources: ['local'] }}
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                        onSuccess={handleUploadSuccess}
                        onUploadAdded={() => {
                            setIsUploading(true);
                            toast({ title: "Uploading...", description: "Your file is being uploaded." });
                        }}
                    >
                      <div className={cn(buttonVariants({variant: 'outline'}), 'w-full flex items-center cursor-pointer', (isUploading || isSubmitting) && 'opacity-50 cursor-not-allowed')}>
                          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
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
          </CardContent>
          <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            <Button type="submit" disabled={isSubmitting || isUploading || (!watchedContent && !watchedFileName)}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Minute'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

// Use Suspense to handle client-side rendering of search params
export default function NewMinutePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MinuteFormPage />
    </Suspense>
  )
}
