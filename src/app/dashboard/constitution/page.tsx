'use client';

import { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, Trash2, Replace, Lock, Wand2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { summarizeConstitution } from "@/ai/flows/summarize-constitution";

// ✅ Import browser-safe pdfjs build
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";




// ✅ Set worker from local import (not CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
interface Constitution {
  content: string; // URL from Cloudinary
  uploadDate: string;
  title: string;
  fileName: string;
}

interface UserProfile {
  role: string;
}

async function extractTextFromPdfClient(url: string): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdfDoc = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(' ') + '\n';
    }
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF on client:', error);
    throw new Error('Could not process the PDF file. Please ensure it is a valid, uncorrupted PDF.');
  }
}

export default function ConstitutionPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

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

  const handleSummarize = async () => {
    if (!constitutionData?.content) {
      setSummary("The constitution document has not been uploaded yet.");
      setIsSummaryOpen(true);
      return;
    };

    setIsSummaryOpen(true);
    if (summary) return; // Don't re-fetch if summary already exists

    setIsSummaryLoading(true);
    try {
      if (!constitutionData.content.toLowerCase().endsWith('.pdf')) {
        throw new Error("The uploaded file is not a PDF and cannot be summarized.");
      }

      const constitutionText = await extractTextFromPdfClient(constitutionData.content);

      if (!constitutionText.trim()) {
        throw new Error("Could not extract any text from the PDF. It might be empty or scanned as an image.");
      }

      const result = await summarizeConstitution({ constitutionText });
      setSummary(result.summary);
    } catch (error: any) {
      console.error("Failed to get summary:", error);
      setSummary(`Sorry, the summary could not be generated at this time. ${error.message}`);
    } finally {
      setIsSummaryLoading(false);
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
              ? "Upload, view, summarize or delete the group's official constitution document (PDF format only)."
              : "View or summarize the group's official constitution document. Only the Chairperson can make changes."}
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

                <Button onClick={handleSummarize} disabled={isSummaryLoading}>
                  {isSummaryLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  {isSummaryLoading ? 'Analyzing...' : 'Summarize with AI'}
                </Button>

                {isChairperson && (
                  <>
                    <CldUploadButton
                      options={{ multiple: false, sources: ['local'], acceptedFiles: 'application/pdf' }}
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      onSuccess={handleUploadSuccess}
                      onUploadAdded={(result: any) => {
                        if (result.file.type !== 'application/pdf') {
                          toast({
                            variant: "destructive",
                            title: "Invalid File Type",
                            description: "Please upload a PDF file only.",
                          });
                          return;
                        }
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
                  options={{ multiple: false, sources: ['local'], acceptedFiles: 'application/pdf' }}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  onSuccess={handleUploadSuccess}
                  onUploadAdded={(result: any) => {
                    if (result.file.type !== 'application/pdf') {
                      toast({
                        variant: "destructive",
                        title: "Invalid File Type",
                        description: "Please upload a PDF file only.",
                      });
                      return;
                    }
                    setIsProcessing(true);
                    toast({ title: "Uploading...", description: "Your file is being uploaded." });
                  }}
                >
                  <Button disabled={isProcessing}>
                    <div className="flex items-center">
                      {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {isProcessing ? 'Uploading...' : 'Upload Constitution (PDF)'}
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

      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>AI Constitution Summary</DialogTitle>
            <DialogDescription>
              Here's a quick overview of the group's constitution. For full details, please refer to the complete document.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isSummaryLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating summary...</p>
                </div>
              </div>
            ) : (
              <div
                className="prose prose-sm max-w-none text-foreground/80 dark:prose-invert prose-headings:font-headline prose-headings:text-foreground"
                dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
