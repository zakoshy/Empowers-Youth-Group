'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, runTransaction, where, query, deleteDoc, writeBatch, addDoc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Lock, CheckCircle2, Trash2, Undo2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
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
import { FINANCIAL_CONFIG } from '@/lib/data';

interface CurrentUserProfile {
    role: string;
}

export default function ApprovalsPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const currentUserProfileRef = useMemoFirebase(() => 
    currentUser ? doc(firestore, 'userProfiles', currentUser.uid) : null, 
    [firestore, currentUser]
  );
  const { data: currentUserProfile, isLoading: isRoleLoading } = useDoc<CurrentUserProfile>(currentUserProfileRef);

  const canApprove = currentUserProfile?.role === 'Admin' || currentUserProfile?.role === 'Treasurer' || currentUserProfile?.role === 'Chairperson';

  const pendingUsersRef = useMemoFirebase(() => 
    canApprove ? query(collection(firestore, 'userProfiles'), where('status', '==', 'pending')) : null, 
    [firestore, canApprove]
  );
  const { data: pendingUsers, isLoading: usersLoading, error } = useCollection<UserProfile>(pendingUsersRef);

  const handleApprove = async (userToApprove: UserProfile) => {
    if (!currentUserProfile || !currentUser) return;
    
    const userDocRef = doc(firestore, 'userProfiles', userToApprove.id);
    const currentRole = currentUserProfile.role;

    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw "User not found";
            }

            const userData = userDoc.data() as UserProfile;
            let newTreasurerApproved = userData.treasurerApproved;
            let newChairpersonApproved = userData.chairpersonApproved;

            if (currentRole === 'Treasurer') newTreasurerApproved = true;
            if (currentRole === 'Chairperson') newChairpersonApproved = true;
            if (currentRole === 'Admin') {
                newTreasurerApproved = true;
                newChairpersonApproved = true;
            }
            
            const updateData: Partial<UserProfile> = {
                treasurerApproved: newTreasurerApproved,
                chairpersonApproved: newChairpersonApproved,
            };
            
            const becomesActive = newTreasurerApproved && newChairpersonApproved;
            if (becomesActive) {
                updateData.status = 'active';
                updateData.role = 'Member';
            }

            transaction.update(userDocRef, updateData);

            if (becomesActive) {
              const incomeRef = doc(collection(firestore, 'miscellaneousIncomes'));
              transaction.set(incomeRef, {
                type: 'Registration Fee',
                description: `Registration fee for ${userToApprove.firstName} ${userToApprove.lastName}`,
                amount: FINANCIAL_CONFIG.REGISTRATION_FEE,
                date: new Date().toISOString(),
                memberId: userToApprove.id,
                recordedBy: currentUser.uid,
              });
            }
        });
        
        toast({ title: 'Success', description: `${userToApprove.firstName} has been approved.`});
    } catch (e) {
      console.error('Error approving user: ', e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not approve user.'});
    }
  };

  const handleUnapprove = async (userToUnapprove: UserProfile) => {
    if (!currentUserProfile || !currentUser) return;
    const userDocRef = doc(firestore, "userProfiles", userToUnapprove.id);
    const currentRole = currentUserProfile.role;
    const updateData: Partial<UserProfile> = {
        status: 'pending',
        role: 'Pending'
    };

    if (currentRole === "Treasurer") updateData.treasurerApproved = false;
    if (currentRole === "Chairperson") updateData.chairpersonApproved = false;
    if (currentRole === "Admin") {
        updateData.treasurerApproved = false;
        updateData.chairpersonApproved = false;
    }

    try {
        await updateDoc(userDocRef, updateData);
        toast({
            title: "Approval Revoked",
            description: `Your approval for ${userToUnapprove.firstName} has been revoked.`,
        });
    } catch (e) {
        console.error("Error unapproving user: ", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not revoke approval.",
        });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'userProfiles', userId);
    try {
        await deleteDoc(userDocRef);
        toast({ title: 'User Deleted', description: 'The pending registration has been deleted.' });
    } catch (error) {
        console.error('Error deleting user: ', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete user.'});
    }
  };
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
  };
  
  const isLoading = isRoleLoading || usersLoading;

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Member Approvals</CardTitle>
                <CardDescription>Review and approve new member registrations.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    );
  }

  if (!canApprove) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Access Denied</CardTitle>
                  <CardDescription>You do not have permission to approve new members.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                  <Lock className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Only Admins, Chairpersons, and Treasurers can access this page.</p>
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Approvals</CardTitle>
        <CardDescription>Review and approve new member registrations. Both the Chairperson and Treasurer must approve an account for it to become active.</CardDescription>
      </CardHeader>
      <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers && pendingUsers.length > 0 ? (
                pendingUsers.map((user) => {
                    const isTreasurerApproved = user.treasurerApproved;
                    const isChairpersonApproved = user.chairpersonApproved;
                    
                    const canCurrentUserUnapprove = 
                        (currentUserProfile?.role === 'Treasurer' && isTreasurerApproved) ||
                        (currentUserProfile?.role === 'Chairperson' && isChairpersonApproved) ||
                        (currentUserProfile?.role === 'Admin' && (isTreasurerApproved || isChairpersonApproved));
                    
                    const canCurrentUserApprove = 
                        (currentUserProfile?.role === 'Treasurer' && !isTreasurerApproved) ||
                        (currentUserProfile?.role === 'Chairperson' && !isChairpersonApproved) ||
                        (currentUserProfile?.role === 'Admin' && (!isTreasurerApproved || !isChairpersonApproved));


                    return (
                        <TableRow key={user.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={user.photoURL} />
                                <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                            </Avatar>
                            <div>{user.firstName} {user.lastName}</div>
                            </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1">
                                <Badge variant={isTreasurerApproved ? "default" : "secondary"} className={isTreasurerApproved ? 'bg-green-500' : ''}>
                                    Treasurer: {isTreasurerApproved ? 'Approved' : 'Pending'}
                                </Badge>
                                <Badge variant={isChairpersonApproved ? "default" : "secondary"} className={isChairpersonApproved ? 'bg-green-500' : ''}>
                                    Chairperson: {isChairpersonApproved ? 'Approved' : 'Pending'}
                                </Badge>
                            </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                           {canCurrentUserApprove && (
                            <Button size="sm" onClick={() => handleApprove(user)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                            </Button>
                           )}
                           {canCurrentUserUnapprove && (
                            <Button variant="secondary" size="sm" onClick={() => handleUnapprove(user)}>
                                <Undo2 className="mr-2 h-4 w-4" />
                                Unapprove
                            </Button>
                           )}

                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this pending registration.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(user.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                        </TableRow>
                    );
                })
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No pending approvals.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      </CardContent>
    </Card>
  );
}
