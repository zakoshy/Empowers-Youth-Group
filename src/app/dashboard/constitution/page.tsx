
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const constitutionSchema = z.object({
  content: z.string().min(50, { message: "Constitution content must be at least 50 characters." }),
});

type ConstitutionFormValues = z.infer<typeof constitutionSchema>;

interface Constitution {
    content: string;
    uploadDate: string;
    title: string;
}

export default function ConstitutionPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const constitutionRef = useMemoFirebase(() => doc(firestore, 'constitution', 'main'), [firestore]);
  const { data: constitutionData, isLoading: isDocLoading } = useDoc<Constitution>(constitutionRef);

  const form = useForm<ConstitutionFormValues>({
    resolver: zodResolver(constitutionSchema),
    defaultValues: {
      content: '',
    },
  });

  useEffect(() => {
    if (constitutionData) {
      form.reset({ content: constitutionData.content });
    }
    if(!isDocLoading) {
        setIsLoading(false)
    }
  }, [constitutionData, form, isDocLoading]);

  const onSubmit = async (values: ConstitutionFormValues) => {
    setIsSubmitting(true);
    try {
      await setDoc(constitutionRef, {
        ...values,
        title: "Group Constitution",
        uploadDate: new Date().toISOString(),
      }, { merge: true });

      toast({
        title: "Success!",
        description: "The constitution has been updated.",
      });
    } catch (error) {
      console.error("Failed to update constitution:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the constitution. Please check your permissions and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Constitution</CardTitle>
        <CardDescription>
          Update the content of the group's constitution. The changes will be visible to all members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Constitution Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the full text of the constitution here..."
                      className="min-h-[400px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Constitution'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
