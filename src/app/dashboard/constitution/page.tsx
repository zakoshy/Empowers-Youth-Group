
'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, Trash2, Replace } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
    content: string; // This will now be the URL
    uploadDate: string;
    title: string;
    fileName: string;
}

const STORAGE_PATH = 'constitution/the_empowers_youth_group_constitution.pdf';

export default function ConstitutionPage() {
  const firestore = useFirestore();
  const storage = getStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const constitutionRef = useMemoFirebase(() => doc(firestore, 'constitution', 'main'), [firestore]);
  const { data: constitutionData, isLoading: isDocLoading, error } = useDoc<Constitution>(constitutionRef);

  useEffect(() => {
    if(!isDocLoading) {
        setIsLoading(false)
    }
  }, [isDocLoading]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    toast({ title: "Uploading...", description: "Your file is being uploaded." });

    try {
      const storageRef = ref(storage, STORAGE_PATH);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await setDoc(constitutionRef, {
        content: downloadURL,
        title: "Group Constitution",
        fileName: file.name,
        uploadDate: new Date().toISOString(),
      });

      toast({
        title: "Success!",
        description: "The constitution has been uploaded.",
      });
    } catch (error) {
      console.error("Failed to upload constitution:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not upload the file. Please check permissions and try again.",
      });
    } finally {
      setIsProcessing(false);
      // Reset file input
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
      if (!constitutionData) return;

      setIsProcessing(true);
      toast({ title: "Deleting...", description: "Removing the constitution file." });

      try {
          // Delete the file from storage
          const storageRef = ref(storage, STORAGE_PATH);
          await deleteObject(storageRef);
          
          // Delete the document from firestore
          await deleteDoc(constitutionRef);
          
          toast({
              title: "Success!",
              description: "The constitution has been deleted.",
          });
      } catch (error: any) {
          // Handle case where file doesn't exist in storage but doc does
          if (error.code === 'storage/object-not-found') {
                await deleteDoc(constitutionRef); // Still delete the firestore doc
                toast({
                    title: "Success!",
                    description: "The constitution record was removed.",
                });
          } else {
            console.error("Failed to delete constitution:", error);
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: "Could not delete the file. Please try again.",
            });
          }
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
        <Input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx"
        />
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
                     <Button variant="secondary" onClick={handleFileSelect} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Replace className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Replace</span>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                <span className="ml-2 hidden sm:inline">Delete</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the constitution file.
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
                <Button onClick={handleFileSelect} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isProcessing ? 'Uploading...' : 'Upload Constitution'}
                </Button>
            </div>
        )}
        {error && <p className="text-sm text-destructive text-center">Error: {error.message}</p>}
      </CardContent>
    </Card>
  );
}

    