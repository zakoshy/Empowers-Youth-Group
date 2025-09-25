'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
  const [optimisticPhotoURL, setOptimisticPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.photoURL) {
      setOptimisticPhotoURL(userProfile.photoURL);
    } else if (!isProfileLoading) {
      setOptimisticPhotoURL(null);
    }
  }, [userProfile?.photoURL, isProfileLoading]);

  const getInitials = () => {
    if (!userProfile) return '';
    return `${userProfile.firstName?.charAt(0) ?? ''}${userProfile.lastName?.charAt(0) ?? ''}`.toUpperCase();
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !userProfileRef) return;

    setIsUploading(true);
    
    const tempLocalUrl = URL.createObjectURL(file);
    setOptimisticPhotoURL(tempLocalUrl);

    toast({
      title: 'Uploading...',
      description: 'Your new profile picture is being updated.',
    });

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `profilePictures/${user.uid}/${file.name}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Use setDoc with merge to create or update the photoURL field
      await Promise.all([
        updateProfile(user, { photoURL: downloadURL }),
        setDoc(userProfileRef, { photoURL: downloadURL }, { merge: true })
      ]);
      
      setOptimisticPhotoURL(downloadURL);

      toast({
        title: 'Success!',
        description: 'Your profile picture has been updated.',
      });

    } catch (uploadError: any) {
      console.error('Error uploading file:', uploadError);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: uploadError.message || 'There was an error uploading your picture. Please try again.',
      });
      setOptimisticPhotoURL(userProfile?.photoURL || null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(tempLocalUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
            <Input
              id="picture"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
              disabled={isUploading}
            />
            <button
              onClick={handleCameraClick}
              disabled={isUploading}
              className="absolute bottom-1 right-1 bg-secondary text-secondary-foreground rounded-full p-2 cursor-pointer hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Change profile picture"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 w-full text-center sm:text-left">
            <h2 className="text-2xl font-bold">{userProfile?.firstName} {userProfile?.lastName}</h2>
            <p className="text-muted-foreground">{userProfile?.email}</p>
            {isUploading && <p className="text-sm text-primary mt-2">Updating photo...</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
