'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { CldUploadButton, CldUploadWidget } from 'next-cloudinary';
import type { CldUploadWidgetResults } from 'next-cloudinary';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Pencil, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { cn } from "@/lib/utils";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoURL?: string | null;
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const [isUploading, setIsUploading] = useState(false);
  const [optimisticPhotoURL, setOptimisticPhotoURL] = useState<string | null>(null);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');

  useEffect(() => {
    if (userProfile?.photoURL) {
      setOptimisticPhotoURL(userProfile.photoURL);
    } else if (user?.photoURL) {
      setOptimisticPhotoURL(user.photoURL);
    } else {
        setOptimisticPhotoURL(null);
    }
    if (userProfile?.phone) {
      setNewPhoneNumber(userProfile.phone);
    }
  }, [userProfile, user]);

  const getInitials = () => {
    if (!userProfile) return '';
    return `${userProfile.firstName?.charAt(0) ?? ''}${userProfile.lastName?.charAt(0) ?? ''}`.toUpperCase();
  };

  const handleUploadSuccess = async (result: CldUploadWidgetResults) => {
    const secureUrl = typeof result?.info === 'object' && 'secure_url' in result.info ? result.info.secure_url : null;

    if (!secureUrl || !user || !userProfileRef) {
        setIsUploading(false);
        return;
    };

    setOptimisticPhotoURL(secureUrl);
    
    try {
      await updateProfile(user, { photoURL: secureUrl });
      await updateDoc(userProfileRef, { photoURL: secureUrl });

      toast({
        title: 'Success!',
        description: 'Your profile picture has been updated.',
      });
    } catch (updateError: any) {
      console.error('Error updating profile:', updateError);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: updateError.message || 'There was an error updating your picture.',
      });
      setOptimisticPhotoURL(userProfile?.photoURL || user?.photoURL || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhoneUpdate = async () => {
    if (!userProfileRef || !newPhoneNumber) return;
    try {
      await updateDoc(userProfileRef, { phone: newPhoneNumber });
      toast({
        title: 'Success!',
        description: 'Your phone number has been updated.',
      });
      setIsPhoneDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating phone number:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update your phone number. Please try again.',
      });
    }
  };
  
  const handleRemovePhoto = async () => {
      if (!user || !userProfileRef) return;
      
      const previousPhotoURL = optimisticPhotoURL;
      setOptimisticPhotoURL(null);

      try {
          await updateProfile(user, { photoURL: "" }); // Use empty string for auth
          await updateDoc(userProfileRef, { photoURL: null }); // Use null for Firestore
          toast({
              title: "Profile Picture Removed",
              description: "Your profile picture has been removed successfully.",
          });
      } catch (error: any) {
          console.error("Error removing photo:", error);
          toast({
              variant: "destructive",
              title: "Removal Failed",
              description: "Could not remove your profile picture. Please try again.",
          });
           // Revert optimistic update
          setOptimisticPhotoURL(previousPhotoURL);
      }
  };


  const isLoading = isUserLoading || isProfileLoading;
  const displayPhoto = optimisticPhotoURL;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>View and edit your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={displayPhoto || undefined} alt="Profile picture" />
                <AvatarFallback className="text-4xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <CldUploadButton
                  options={{ multiple: false, sources: ['local'] }}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  onSuccess={handleUploadSuccess}
                  onUploadAdded={() => setIsUploading(true)}
              >
                  <div
                      className="absolute bottom-1 right-1 bg-secondary text-secondary-foreground rounded-full p-2 cursor-pointer hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                  </div>
              </CldUploadButton>
            </div>

            <div className="flex-1 w-full text-center sm:text-left">
              <h2 className="text-2xl font-bold">{userProfile?.firstName} {userProfile?.lastName}</h2>
              <p className="text-muted-foreground">{userProfile?.email}</p>
              <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
                <p className="text-muted-foreground">{userProfile?.phone || 'No phone number'}</p>
                <button onClick={() => setIsPhoneDialogOpen(true)} aria-label="Edit phone number">
                  <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </button>
              </div>
                {displayPhoto && (
                   <div className="flex gap-2 mt-4 justify-center sm:justify-start">
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="sm">
                           <Trash2 className="mr-2 h-4 w-4" />
                           Remove Photo
                         </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                           <AlertDialogDescription>
                             This action will remove your profile picture. You can always upload a new one later.
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Cancel</AlertDialogCancel>
                           <AlertDialogAction onClick={handleRemovePhoto}>Remove</AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                   </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Phone Number</DialogTitle>
            <DialogDescription>
              Enter your new phone number below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="phone"
              value={newPhoneNumber}
              onChange={(e) => setNewPhoneNumber(e.target.value)}
              placeholder="Phone Number"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handlePhoneUpdate}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
