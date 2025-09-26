
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MONTHS, FINANCIAL_CONFIG } from '@/lib/data';
import debounce from 'lodash.debounce';

interface UserProfile {
  id: string;
  firstName: string;
  lastName:string;
  role: string;
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
  
  const usersRef = useMemoFirebase(() => collection(firestore, 'userProfiles'), [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersRef);
  
  const [contributions, setContributions] = useState<Record<string, Record<string, number>>>({});
  const [loadingContributions, setLoadingContributions] = useState(true);
  const [saving, setSaving] = useState(false);

  const members = users?.filter(u => u.role !== 'Admin') || [];

  const fetchContributions = useCallback(async () => {
    if (!members.length) {
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
    fetchContributions();
  }, [users]); // Refetch when users list is loaded/changed

  const debouncedSave = useCallback(
    debounce(async (userId: string, month: number, amount: number) => {
      setSaving(true);
      const contributionId = `${MONTHS[month].toLowerCase()}_${currentYear}`;
      const docRef = doc(firestore, 'userProfiles', userId, 'contributions', contributionId);
      
      try {
        await setDoc(docRef, {
          year: currentYear,
          month: month,
          amount: amount,
        }, { merge: true });

        toast({
            title: 'Saved!',
            description: `Contribution for ${MONTHS[month]} updated.`,
        });

      } catch (error) {
        console.error("Failed to save contribution:", error);
        toast({
            variant: "destructive",
            title: 'Save Failed',
            description: `Could not update contribution.`,
        });
      } finally {
        setSaving(false);
      }
    }, 1000), // 1-second debounce delay
    [firestore, toast]
  );

  const handleAmountChange = (userId: string, month: number, value: string) => {
    const amount = Number(value);
    if (isNaN(amount)) return;

    const monthKey = MONTHS[month].toLowerCase();
    
    setContributions(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [monthKey]: amount,
      },
    }));

    debouncedSave(userId, month, amount);
  };
  
  const isLoading = usersLoading || loadingContributions;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Member Contributions - {currentYear}</CardTitle>
        <CardDescription>
            Enter and update the monthly contributions for each member. Changes are saved automatically.
            {saving && <span className="ml-2 text-sm text-primary animate-pulse">Saving...</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10">Member</TableHead>
                  {MONTHS.map(month => (
                    <TableHead key={month} className="min-w-[120px]">{month}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10">
                      {member.firstName} {member.lastName}
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
        )}
      </CardContent>
    </Card>
  );
}
