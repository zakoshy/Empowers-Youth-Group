
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, Trash2, Replace } from 'lucide-react';
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

export default function ConstitutionPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const constitutionRef = useMemoFirebase(() => doc(firestore, 'constitution', 'main'), [firestore]);
  const { data: constitutionData, isLoading: isDocLoading } = useDoc<Constitution>(constitutionRef);

  useEffect(() => {
    if(!isDocLoading) {
        setIsLoading(false)
    }
  }, [isDocLoading]);

  const handleUploadSuccess = async (result: any) => {
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
        title: "Group Constitution",
        fileName: originalFilename,
        uploadDate: new Date().toISOString(),
      });

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
          // In this model, we just delete the Firestore document.
          // The file remains on Cloudinary, but is no longer linked in the app.
          // For a full implementation, you might want to delete from Cloudinary as well
          // using their Admin API on a backend function.
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
            description: "Could not delete the constitution record. Please try again.",
        });
      } finally {
          setIsProcessing(false);
      }
  }
  
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
    <Card>
      <CardHeader>
        <CardTitle>Manage Constitution</CardTitle>
        <CardDescription>
          Upload, view, or delete the group's official constitution document.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {constitutionData ? (
            <div className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className='flex items-center gap-4'>
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                        <p className="font-semibold">{constitutionData.fileName}</p>
                        <p className="text-sm text-muted-foreground">Uploaded on: {new Date(constitutionData.uploadDate).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <a href={constitutionData.content} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                    <CldUploadButton
                        options={{ multiple: false, sources: ['local'], accepted_file_types: ['pdf', 'doc', 'docx'] }}
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                        onSuccess={handleUploadSuccess}
                        onUploadAdded={() => {
                            setIsProcessing(true);
                            toast({ title: "Uploading...", description: "Your file is being uploaded." });
                        }}
                    >
                        <Button variant="secondary" asChild>
                           <span>
                             {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Replace className="h-4 w-4" />}
                             <span className="ml-2 hidden sm:inline">Replace</span>
                           </span>
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
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <p className="mb-4 text-muted-foreground">No constitution has been uploaded yet.</p>
                <CldUploadButton
                    options={{ multiple: false, sources: ['local'], accepted_file_types: ['pdf', 'doc', 'docx'] }}
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                    onSuccess={handleUploadSuccess}
                    onUploadAdded={() => {
                        setIsProcessing(true);
                        toast({ title: "Uploading...", description: "Your file is being uploaded." });
                    }}
                >
                    <Button asChild disabled={isProcessing}>
                       <span>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {isProcessing ? 'Uploading...' : 'Upload Constitution'}
                       </span>
                    </Button>
                </CldUploadButton>

            </div>
        )}
      </CardContent>
    </Card>
  );
}
