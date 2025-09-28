'use client';

import { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, Trash2, Replace, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CldUploadButton } from 'next-cloudinary';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Constitution {
  content: string; // URL from Cloudinary
  uploadDate: string;
  title: string;
  fileName: string;
}

interface UserProfile {
  role: string;
}

export default function ConstitutionPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  const constitutionRef = useMemoFirebase(() => doc(firestore, 'constitution', 'main'), [firestore]);
  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'userProfiles', user.uid) : null, [firestore, user]);

  const { data: constitutionData, isLoading: isDocLoading } = useDoc<Constitution>(constitutionRef);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isDocLoading || isProfileLoading;
  const isChairperson = userProfile?.role === 'Chairperson' || userProfile?.role === 'Admin';

  const handleUploadSuccess = async (result: any) => {
    setIsProcessing(true);
    const fileUrl = result?.info?.secure_url;
    const originalFilename = result?.info?.original_filename;

    if (!fileUrl) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not get the file URL from Cloudinary.",
      });
      setIsProcessing(false);
      return;
    }

    try {
      await setDoc(constitutionRef, {
        content: fileUrl,
        title: originalFilename || "The Empowers Constitution",
        fileName: originalFilename ? `${originalFilename}` : "The Empowers Constitution",
        uploadDate: new Date().toISOString(),
      }, { merge: true });

      toast({
        title: "Success!",
        description: "The constitution has been uploaded.",
      });
    } catch (error) {
      console.error("Failed to save constitution URL to Firestore:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save the file information. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!constitutionData) return;

    setIsProcessing(true);
    toast({ title: "Deleting...", description: "Removing the constitution record." });

    try {
      await deleteDoc(constitutionRef);

      toast({
        title: "Success!",
        description: "The constitution has been deleted.",
      });
    } catch (error: any) {
      console.error("Failed to delete constitution:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the constitution record. Check your permissions.",
      });
    } finally {
      setIsProcessing(false);
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
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage Constitution</CardTitle>
          <CardDescription>
            {isChairperson
              ? "Upload, view, or delete the group's official constitution document."
              : "View the group's official constitution document. Only the Chairperson can make changes."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {constitutionData && constitutionData.content ? (
            <div className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className='flex items-center gap-4'>
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">{constitutionData.fileName}</p>
                  <p className="text-sm text-muted-foreground">Uploaded on: {new Date(constitutionData.uploadDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" asChild>
                  <a href={constitutionData.content} target="_blank" rel="noopener noreferrer">View</a>
                </Button>

                {isChairperson && (
                  <>
                    <CldUploadButton
                      options={{ multiple: false, sources: ['local'] }}
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      onSuccess={handleUploadSuccess}
                      onUploadAdded={() => {
                        setIsProcessing(true);
                        toast({ title: "Uploading...", description: "Your file is being uploaded." });
                      }}
                    >
                      <Button variant="secondary" disabled={isProcessing}>
                        <div className="flex items-center">
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Replace className="h-4 w-4" />}
                          <span className="ml-2 hidden sm:inline">Replace</span>
                        </div>
                      </Button>
                    </CldUploadButton>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isProcessing}>
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-2 hidden sm:inline">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the constitution record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
              <p className="mb-4 text-muted-foreground">No constitution has been uploaded yet.</p>
              {isChairperson ? (
                <CldUploadButton
                  options={{ multiple: false, sources: ['local'] }}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  onSuccess={handleUploadSuccess}
                  onUploadAdded={() => {
                    setIsProcessing(true);
                    toast({ title: "Uploading...", description: "Your file is being uploaded." });
                  }}
                >
                  <Button disabled={isProcessing}>
                    <div className="flex items-center">
                      {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {isProcessing ? 'Uploading...' : 'Upload Constitution'}
                    </div>
                  </Button>
                </CldUploadButton>
              ) : (
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Lock className="h-4 w-4" />
                  <span>Only the Chairperson can upload a document.</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
