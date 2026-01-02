
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query, where, deleteDoc, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MONTHS, FINANCIAL_CONFIG, Expenditure, MiscellaneousIncome } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AddSpecialContributionDialog } from './add-special-contribution-dialog';
import { EditSpecialContributionDialog } from './edit-special-contribution-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { TreasurerInsights } from './treasurer-insights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OtherIncome } from './other-income';


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

export interface SpecialContribution {
    id: string;
    userId: string;
    financialYearId: string;
    date: string;
    amount: number;
    month: number;
    year: number;
}

interface TreasurerDashboardProps {
  isReadOnly: boolean;
}


const currentYear = new Date().getFullYear();

export default function TreasurerDashboard({ isReadOnly }: TreasurerDashboardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const usersRef = useMemoFirebase(() => query(collection(firestore, 'userProfiles'), where('role', '!=', 'Admin')), [firestore]);
  const expendituresRef = useMemoFirebase(() => query(collection(firestore, 'expenditures'), where('year', '==', currentYear)), [firestore]);
  const otherIncomesRef = useMemoFirebase(() => query(collection(firestore, 'miscellaneousIncomes')), [firestore]);
  const { data: members, isLoading: usersLoading } = useCollection<UserProfile>(usersRef);
  const { data: expenditures, isLoading: expendituresLoading } = useCollection<Expenditure>(expendituresRef);
  const { data: otherIncomes, isLoading: otherIncomesLoading } = useCollection<MiscellaneousIncome>(otherIncomesRef);
  
  const [contributions, setContributions] = useState<Record<string, Record<string, number>>>({});
  const [specialContributions, setSpecialContributions] = useState<Record<string, SpecialContribution[]>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isAddSpecialOpen, setIsAddSpecialOpen] = useState(false);
  const [isEditSpecialOpen, setIsEditSpecialOpen] = useState(false);
  const [specialContributionData, setSpecialContributionData] = useState<{member: UserProfile; month: number; year: number} | null>(null);
  const [editingContribution, setEditingContribution] = useState<SpecialContribution | null>(null);


  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
  };
  
  const fetchSpecialContributions = useCallback(async () => {
    if (!members || !members.length) return;

    const allSpecialContributions: Record<string, SpecialContribution[]> = {};
    for (const member of members) {
      const specialContributionsRef = collection(firestore, 'userProfiles', member.id, 'specialContributions');
      const qSpecial = query(specialContributionsRef, where('year', '==', currentYear));
      const specialSnapshot = await getDocs(qSpecial);

      const memberSpecialContributions: SpecialContribution[] = [];
      specialSnapshot.forEach(doc => {
          memberSpecialContributions.push({ id: doc.id, ...(doc.data() as Omit<SpecialContribution, 'id'>) });
      });
      allSpecialContributions[member.id] = memberSpecialContributions;
    }
    setSpecialContributions(allSpecialContributions);
  }, [firestore, members]);

  const fetchData = useCallback(async () => {
    if (!members || !members.length) {
        setLoadingData(false);
        return;
    };
    
    setLoadingData(true);
    const allContributions: Record<string, Record<string, number>> = {};
    
    for (const member of members) {
      // Fetch regular contributions
      const contributionsRef = collection(firestore, 'userProfiles', member.id, 'contributions');
      const qCont = query(contributionsRef, where('year', '==', currentYear));
      const contSnapshot = await getDocs(qCont);
      
      const memberContributions: Record<string, number> = {};
      contSnapshot.forEach(doc => {
        const data = doc.data() as Contribution;
        memberContributions[MONTHS[data.month].toLowerCase()] = data.amount;
      });
      allContributions[member.id] = memberContributions;
    }
    
    setContributions(allContributions);
    await fetchSpecialContributions(); // Also fetch special contributions
    setLoadingData(false);
  }, [firestore, members, fetchSpecialContributions]);

  useEffect(() => {
    if (members && members.length > 0) {
      fetchData();
    } else if (!usersLoading) {
      // If there are no members and we are not loading, stop loading data.
      setLoadingData(false);
    }
  }, [members, usersLoading, fetchData]);

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
            userId: userId,
            financialYearId: currentYear.toString(),
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

  const handleOpenAddSpecialDialog = (member: UserProfile, monthIndex: number) => {
    setSpecialContributionData({member, month: monthIndex, year: currentYear});
    setIsAddSpecialOpen(true);
  }

  const handleOpenEditSpecialDialog = (contribution: SpecialContribution) => {
    setEditingContribution(contribution);
    setIsEditSpecialOpen(true);
  }
  
  const handleDeleteSpecialContribution = async (contribution: SpecialContribution) => {
    const docRef = doc(firestore, 'userProfiles', contribution.userId, 'specialContributions', contribution.id);
    try {
      await deleteDoc(docRef);
      toast({
        title: 'Deleted!',
        description: 'The special contribution has been removed.',
      });
      fetchSpecialContributions(); // Refresh only special contributions data
    } catch (error) {
      console.error('Failed to delete special contribution:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not remove the contribution. Please try again.',
      });
    }
  }

 const grandTotalContributions = useMemo(async () => {
    const contributionsQuery = query(collectionGroup(firestore, 'contributions'));
    const specialContributionsQuery = query(collectionGroup(firestore, 'specialContributions'));
    
    const [contSnap, specialContSnap] = await Promise.all([
      getDocs(contributionsQuery),
      getDocs(specialContributionsQuery),
    ]);

    const monthlyTotal = contSnap.docs.reduce((sum, doc) => sum + (doc.data() as Contribution).amount, 0);
    const specialTotal = specialContSnap.docs.reduce((sum, doc) => sum + (doc.data() as SpecialContribution).amount, 0);
    
    return monthlyTotal + specialTotal;
  }, [firestore, contributions, specialContributions]);

  const totalExpenditure = useMemo(() => {
    if (!expenditures) return 0;
    return expenditures.reduce((total, exp) => total + exp.amount, 0);
  }, [expenditures]);

  const totalOtherIncomes = useMemo(() => {
    if(!otherIncomes) return 0;
    return otherIncomes.reduce((total, income) => total + income.amount, 0)
  }, [otherIncomes]);

  const [netTotal, setNetTotal] = useState(0);

  useEffect(() => {
    const calculateNetTotal = async () => {
        const totalContributions = await grandTotalContributions;
        setNetTotal(totalContributions + totalOtherIncomes - totalExpenditure);
    };
    calculateNetTotal();
  }, [grandTotalContributions, totalOtherIncomes, totalExpenditure]);

  
  const isLoading = usersLoading || loadingData || expendituresLoading || otherIncomesLoading;

  const allMembersDataForAI = useMemo(() => {
    if (!members) return [];
    return members.map(member => ({
        name: `${member.firstName} ${member.lastName}`,
        monthlyContributions: contributions[member.id] || {},
        specialContributions: specialContributions[member.id] || [],
    }));
  }, [members, contributions, specialContributions]);


  if (isLoading) {
      return <Skeleton className="h-[500px] w-full" />
  }

  if (!members || members.length === 0) {
      return <p>No members found.</p>
  }

  return (
    <>
      <div className="space-y-6">
        {!isReadOnly && (
          <TreasurerInsights 
            allMembersData={allMembersDataForAI}
            totalFunds={netTotal}
            monthlyTarget={FINANCIAL_CONFIG.MONTHLY_CONTRIBUTION}
          />
        )}

        <Tabs defaultValue="contributions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="other-income">Other Income</TabsTrigger>
          </TabsList>
          <TabsContent value="contributions">
             <Card>
              <CardHeader>
                  <CardTitle>Manage Member Contributions - {currentYear}</CardTitle>
                  <CardDescription>
                      {isReadOnly 
                          ? "Viewing all member contributions for the current year. Only the Treasurer can make changes."
                          : "Enter and update monthly contributions. Click the '+' icon to add a miniharambee for a specific month."
                      }
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
                                  <TableHead key={month} className="min-w-[250px] whitespace-nowrap text-center">{month}</TableHead>
                                  ))}
                              </TableRow>
                              </TableHeader>
                              <TableBody>
                              {members.map(member => (
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
                                      const monthlySpecialContributions = specialContributions[member.id]?.filter(sc => sc.month === index) || [];
                                      return (
                                      <TableCell key={month} className="text-center align-top">
                                          <div className="flex items-center gap-1 justify-center">
                                              <Input
                                                type="number"
                                                placeholder="0"
                                                value={value}
                                                onChange={(e) => handleAmountChange(member.id, index, e.target.value)}
                                                className="w-24"
                                                disabled={isReadOnly}
                                              />
                                              {!isReadOnly && (
                                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenAddSpecialDialog(member, index)}>
                                                      <PlusCircle className="h-4 w-4 text-green-500" />
                                                  </Button>
                                              )}
                                          </div>
                                          <div className="mt-2 space-y-1 text-xs text-left">
                                              {monthlySpecialContributions.map(sc => (
                                                  <div key={sc.id} className="flex items-center justify-between gap-1 bg-muted/50 p-1 rounded">
                                                      <span className="truncate" title={format(new Date(sc.date), "PPP")}>Ksh {sc.amount} on {format(new Date(sc.date), "MMM d")}</span>
                                                      {!isReadOnly && (
                                                          <div className="flex">
                                                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenEditSpecialDialog(sc)}><Edit className="h-3 w-3" /></Button>
                                                              <AlertDialog>
                                                                  <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                                                  </AlertDialogTrigger>
                                                                  <AlertDialogContent>
                                                                      <AlertDialogHeader>
                                                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                          <AlertDialogDescription>This action cannot be undone. This will permanently delete the special contribution.</AlertDialogDescription>
                                                                      </AlertDialogHeader>
                                                                      <AlertDialogFooter>
                                                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                          <AlertDialogAction onClick={() => handleDeleteSpecialContribution(sc)}>Delete</AlertDialogAction>
                                                                      </AlertDialogFooter>
                                                                  </AlertDialogContent>
                                                              </AlertDialog>
                                                          </div>
                                                      )}
                                                  </div>
                                              ))}
                                          </div>
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
                          {members.map(member => (
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
                                  const monthlySpecialContributions = specialContributions[member.id]?.filter(sc => sc.month === index) || [];
                                  return (
                                      <div key={month}>
                                          <label htmlFor={`${member.id}-${month}`} className="block text-sm font-medium mb-1">{month}</label>
                                          <div className="flex items-center justify-between gap-2">
                                              <Input
                                                  id={`${member.id}-${month}`}
                                                  type="number"
                                                  placeholder="0"
                                                  value={value}
                                                  onChange={(e) => handleAmountChange(member.id, index, e.target.value)}
                                                  className="flex-grow"
                                                  disabled={isReadOnly}
                                              />
                                              {!isReadOnly && (
                                                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleOpenAddSpecialDialog(member, index)}>
                                                      <PlusCircle className="h-5 w-5 text-green-500" />
                                                  </Button>
                                              )}
                                          </div>
                                          <div className="mt-2 space-y-1 text-xs">
                                              {monthlySpecialContributions.map(sc => (
                                                  <div key={sc.id} className="flex items-center justify-between gap-1 bg-muted/50 p-1 rounded">
                                                      <span className="truncate" title={format(new Date(sc.date), "PPP")}>Ksh {sc.amount} on {format(new Date(sc.date), "MMM d")}</span>
                                                      {!isReadOnly && (
                                                          <div className="flex">
                                                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenEditSpecialDialog(sc)}><Edit className="h-3 w-3" /></Button>
                                                              <AlertDialog>
                                                                  <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                                                  </AlertDialogTrigger>
                                                                  <AlertDialogContent>
                                                                      <AlertDialogHeader>
                                                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                                                      </AlertDialogHeader>
                                                                      <AlertDialogFooter>
                                                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                          <AlertDialogAction onClick={() => handleDeleteSpecialContribution(sc)}>Delete</AlertDialogAction>
                                                                      </AlertDialogFooter>
                                                                  </AlertDialogContent>
                                                              </AlertDialog>
                                                          </div>
                                                      )}
                                                  </div>
                                              ))}
                                          </div>
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
              <CardFooter className="justify-between items-center flex-wrap gap-4">
                  <div className="text-lg font-bold">
                    Total Funds (Net): <span className="text-primary">Ksh {netTotal.toLocaleString()}</span>
                  </div>
                  {!isReadOnly && (
                      <Button onClick={handleUpdateContributions} disabled={isSaving}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isSaving ? 'Updating...' : 'Update Contributions'}
                      </Button>
                  )}
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="other-income">
             <OtherIncome members={members} />
          </TabsContent>
        </Tabs>
      </div>

      {specialContributionData && (
          <AddSpecialContributionDialog
              isOpen={isAddSpecialOpen}
              onOpenChange={(isOpen) => {
                  setIsAddSpecialOpen(isOpen);
                  if (!isOpen) fetchSpecialContributions(); // Refresh on close
              }}
              member={specialContributionData.member}
              month={specialContributionData.month}
              year={specialContributionData.year}
          />
      )}
      {editingContribution && (
          <EditSpecialContributionDialog
              isOpen={isEditSpecialOpen}
              onOpenChange={(isOpen) => {
                  setIsEditSpecialOpen(isOpen);
                  if (!isOpen) fetchSpecialContributions(); // Refresh on close
              }}
              contribution={editingContribution}
          />
      )}
    </>
  );
}
