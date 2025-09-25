'use client';

import { useState, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera } from 'lucide-react';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);

  const [isUploading, setIsUploading] = useState(false);
  const [optimisticPhotoURL, setOptimisticPhotoURL] = useState<string | undefined>(undefined);

  const getInitials = () => {
    if (!userProfile) return '';
    return `${userProfile.firstName?.charAt(0) ?? ''}${userProfile.lastName?.charAt(0) ?? ''}`.toUpperCase();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a temporary URL for optimistic update
      const tempUrl = URL.createObjectURL(file);
      setOptimisticPhotoURL(tempUrl);
      handleUpload(file);
    }
  };

  const handleUpload = (file: File) => {
    if (!user) return;

    setIsUploading(true);
    toast({
      title: 'Uploading...',
      description: 'Your new profile picture is being uploaded.',
    });

    const storage = getStorage();
    const storageRef = ref(storage, `profilePictures/${user.uid}/${file.name}`);

    uploadBytes(storageRef, file)
      .then(snapshot => getDownloadURL(snapshot.ref))
      .then(async (photoURL) => {
        // We have the final URL, now update Auth and Firestore non-blockingly
        await updateProfile(user, { photoURL });
        if (userProfileRef) {
          await updateDoc(userProfileRef, { photoURL });
        }
        
        // No need to set optimistic URL here, the useDoc hook will refresh with the new data.
        // We can revoke the object URL to free memory.
        if (optimisticPhotoURL?.startsWith('blob:')) {
            URL.revokeObjectURL(optimisticPhotoURL);
        }
        setOptimisticPhotoURL(undefined);

        toast({
          title: 'Success!',
          description: 'Your profile picture has been updated.',
        });
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'There was an error uploading your picture. Please try again.',
        });
        // Revert optimistic update on failure
        setOptimisticPhotoURL(undefined);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  const isLoading = isUserLoading || isProfileLoading;
  const displayPhoto = optimisticPhotoURL || userProfile?.photoURL;

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
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>View and edit your personal information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <Avatar className="h-32 w-32">
              <AvatarImage src={displayPhoto} />
              <AvatarFallback className="text-4xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <Input
              id="picture"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              disabled={isUploading}
            />
            <Label
              htmlFor="picture"
              className="absolute bottom-1 right-1 bg-secondary text-secondary-foreground rounded-full p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              <Camera className="h-5 w-5" />
              <span className="sr-only">Change profile picture</span>
            </Label>
          </div>

          <div className="flex-1 w-full text-center sm:text-left">
            <h2 className="text-2xl font-bold">{userProfile?.firstName} {userProfile?.lastName}</h2>
            <p className="text-muted-foreground">{userProfile?.email}</p>
            {isUploading && <p className="text-sm text-primary mt-2">Uploading new photo...</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
