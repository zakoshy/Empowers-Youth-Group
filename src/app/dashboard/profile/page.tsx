'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, Auth, User } from 'firebase/auth';

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
    // When userProfile data loads, sync the optimistic URL
    if (userProfile?.photoURL) {
      setOptimisticPhotoURL(userProfile.photoURL);
    } else if (!isProfileLoading) {
      // If loading is finished and there's no photoURL, clear it
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
    
    // 1. Create a temporary local URL for instant preview
    const tempLocalUrl = URL.createObjectURL(file);
    setOptimisticPhotoURL(tempLocalUrl);

    toast({
      title: 'Uploading...',
      description: 'Your new profile picture is being updated.',
    });

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `profilePictures/${user.uid}/${file.name}`);
      
      // 2. Upload the file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, file);
      
      // 3. Get the permanent downloadable URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 4. Update Firebase Auth profile and Firestore document in parallel
      await Promise.all([
        updateProfile(user, { photoURL: downloadURL }),
        updateDoc(userProfileRef, { photoURL: downloadURL })
      ]);
      
      // 5. Set the final, permanent URL for the UI
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
      // Revert to the original photo on failure
      setOptimisticPhotoURL(userProfile?.photoURL || null);
    } finally {
      setIsUploading(false);
      // Clean up the temporary local URL
      URL.revokeObjectURL(tempLocalUrl);
      // Reset file input to allow re-selection of the same file if needed
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
