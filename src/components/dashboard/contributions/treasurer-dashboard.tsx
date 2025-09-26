
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MONTHS } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AddSpecialContributionForm } from './add-special-contribution-form';
import { SpecialContributionsList } from './special-contributions-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface UserProfile {
  id: string;
  firstName: string;
  lastName:string;
  role: string;
  photoURL?: string;
}

interface Contribution {
  id: string;
  month: number;
  amount: number;
  year: number;
}

const currentYear = new Date().getFullYear();

export default function TreasurerDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const usersRef = useMemoFirebase(() => query(collection(firestore, 'userProfiles'), where('role', '!=', 'Admin')), [firestore]);
  const { data: members, isLoading: usersLoading } = useCollection<UserProfile>(usersRef);
  
  const [contributions, setContributions] = useState<Record<string, Record<string, number>>>({});
  const [loadingContributions, setLoadingContributions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
  };

  const fetchContributions = useCallback(async () => {
    if (!members || !members.length) {
        setLoadingContributions(false);
        return;
    };
    
    setLoadingContributions(true);
    const allContributions: Record<string, Record<string, number>> = {};

    for (const member of members) {
      const contributionsRef = collection(firestore, 'userProfiles', member.id, 'contributions');
      const q = query(contributionsRef, where('year', '==', currentYear));
      const snapshot = await getDocs(q);
      
      const memberContributions: Record<string, number> = {};
      snapshot.forEach(doc => {
        const data = doc.data() as Contribution;
        memberContributions[MONTHS[data.month].toLowerCase()] = data.amount;
      });
      allContributions[member.id] = memberContributions;
    }
    
    setContributions(allContributions);
    setLoadingContributions(false);
  }, [firestore, members]);

  useEffect(() => {
    if (members) {
      fetchContributions();
    }
  }, [members, fetchContributions]);

  const handleAmountChange = (userId: string, monthIndex: number, value: string) => {
    const amount = Number(value);
    if (isNaN(amount)) return;

    const monthKey = MONTHS[monthIndex].toLowerCase();
    
    setContributions(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [monthKey]: amount,
      },
    }));
  };

  const handleUpdateContributions = async () => {
    setIsSaving(true);
    const batch = writeBatch(firestore);

    Object.entries(contributions).forEach(([userId, monthlyData]) => {
      Object.entries(monthlyData).forEach(([monthName, amount]) => {
        const monthIndex = MONTHS.findIndex(m => m.toLowerCase() === monthName);
        if (monthIndex !== -1) {
          const contributionId = `${monthName}_${currentYear}`;
          const docRef = doc(firestore, 'userProfiles', userId, 'contributions', contributionId);
          batch.set(docRef, {
            year: currentYear,
            month: monthIndex,
            amount: amount,
          }, { merge: true });
        }
      });
    });

    try {
      await batch.commit();
      toast({
        title: 'Success!',
        description: 'All member contributions have been updated.',
      });
    } catch (error) {
      console.error("Failed to save contributions:", error);
      toast({
          variant: "destructive",
          title: 'Update Failed',
          description: 'Could not update contributions. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const isLoading = usersLoading || loadingContributions;

  if (isLoading) {
      return <Skeleton className="h-[500px] w-full" />
  }

  if (!members) {
      return <p>No members found.</p>
  }

  return (
    <Tabs defaultValue="monthly">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly Contributions</TabsTrigger>
            <TabsTrigger value="special">Miniharambees</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly">
            <Card>
            <CardHeader>
                <CardTitle>Manage Member Contributions - {currentYear}</CardTitle>
                <CardDescription>
                    Enter and update the monthly contributions for each member. Click "Update Contributions" to save all changes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
                ) : (
                <>
                    {/* Desktop View: Table */}
                    <div className="hidden md:block">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-card z-10 min-w-[200px] whitespace-nowrap">Member</TableHead>
                                {MONTHS.map(month => (
                                <TableHead key={month} className="min-w-[120px] whitespace-nowrap">{month}</TableHead>
                                ))}
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {members && members.map(member => (
                                <TableRow key={member.id}>
                                <TableCell className="font-medium sticky left-0 bg-card z-10 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={member.photoURL} />
                                        <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                                    </Avatar>
                                    <span>{member.firstName} {member.lastName}</span>
                                    </div>
                                </TableCell>
                                {MONTHS.map((month, index) => {
                                    const monthKey = month.toLowerCase();
                                    const value = contributions[member.id]?.[monthKey] || '';
                                    return (
                                    <TableCell key={month}>
                                        <Input
                                        type="number"
                                        placeholder="0"
                                        value={value}
                                        onChange={(e) => handleAmountChange(member.id, index, e.target.value)}
                                        className="w-24"
                                        />
                                    </TableCell>
                                    );
                                })}
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                    </div>

                    {/* Mobile View: Accordion */}
                    <div className="md:hidden">
                    <Accordion type="multiple" className="w-full">
                        {members && members.map(member => (
                        <AccordionItem value={member.id} key={member.id}>
                            <AccordionTrigger>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                <AvatarImage src={member.photoURL} />
                                <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                                </Avatar>
                                <span>{member.firstName} {member.lastName}</span>
                            </div>
                            </AccordionTrigger>
                            <AccordionContent>
                            <div className="space-y-4 p-2">
                                {MONTHS.map((month, index) => {
                                const monthKey = month.toLowerCase();
                                const value = contributions[member.id]?.[monthKey] || '';
                                return (
                                    <div key={month} className="flex items-center justify-between gap-4">
                                    <label htmlFor={`${member.id}-${month}`}>{month}</label>
                                    <Input
                                        id={`${member.id}-${month}`}
                                        type="number"
                                        placeholder="0"
                                        value={value}
                                        onChange={(e) => handleAmountChange(member.id, index, e.target.value)}
                                        className="w-32 text-right"
                                    />
                                    </div>
                                )
                                })}
                            </div>
                            </AccordionContent>
                        </AccordionItem>
                        ))}
                    </Accordion>
                    </div>
                </>
                )}
            </CardContent>
            <CardFooter className="justify-end">
                <Button onClick={handleUpdateContributions} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Updating...' : 'Update Contributions'}
                </Button>
            </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="special">
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <AddSpecialContributionForm members={members} />
                </div>
                <div className="lg:col-span-2">
                    <SpecialContributionsList />
                </div>
            </div>
        </TabsContent>
    </Tabs>
  );
}

    