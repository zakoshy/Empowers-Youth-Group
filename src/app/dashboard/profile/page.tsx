'use client';

import { useState } from 'react';
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

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const getInitials = () => {
    if (!userProfile) return '';
    return `${userProfile.firstName?.charAt(0) ?? ''}${userProfile.lastName?.charAt(0) ?? ''}`.toUpperCase();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setNewPhoto(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!newPhoto || !user) return;

    setIsUploading(true);
    const storage = getStorage();
    const storageRef = ref(storage, `profilePictures/${user.uid}/${newPhoto.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, newPhoto);
      const photoURL = await getDownloadURL(snapshot.ref);

      // Update Firebase Auth user profile
      await updateProfile(user, { photoURL });

      // Update Firestore user profile
      if (userProfileRef) {
        await updateDoc(userProfileRef, { photoURL });
      }

      setNewPhoto(null);
      toast({
        title: 'Success!',
        description: 'Your profile picture has been updated.',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'There was an error uploading your picture. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-10 w-full" />
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
          <Avatar className="h-24 w-24">
            <AvatarImage src={userProfile?.photoURL} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 w-full text-center sm:text-left">
            <h2 className="text-2xl font-bold">{userProfile?.firstName} {userProfile?.lastName}</h2>
            <p className="text-muted-foreground">{userProfile?.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="picture">Profile Picture</Label>
          <div className="flex items-center gap-4">
            <Input id="picture" type="file" onChange={handleFileChange} className="max-w-xs" />
            <Button onClick={handleUpload} disabled={!newPhoto || isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose a new profile picture to upload.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
