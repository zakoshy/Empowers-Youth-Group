'use client';

import { useMemo, useEffect, useState } from 'react';
import { useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, collectionGroup, doc, query, getDocs, Firestore } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/alert';
import type { MiscellaneousIncome } from '@/lib/data';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Separator } from '@/components/ui/separator';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  role: string;
  status: 'pending' | 'active';
}

interface Contribution {
  userId: string;
  amount: number;
  year: number;
}

interface SharesBreakdown {
    totalMiscIncomes: number;
    totalFromDeletedUsers: number;
    totalPooledFunds: number;
    numberOfMembers: number;
}

interface SharesData {
    memberShares: (UserProfile & { 
        personalContribution: number;
        groupFundsShare: number;
        totalShareValue: number; 
        sharePercentage: number 
    })[];
    grandTotal: number;
    breakdown: SharesBreakdown;
}

const getInitials = (firstName = '', lastName = '') => {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
};

async function fetchAllDataForShares(firestore: Firestore): Promise<SharesData> {
    const allUsersQuery = query(collection(firestore, 'userProfiles'));
    const contributionsQuery = query(collectionGroup(firestore, 'contributions'));
    const specialContributionsQuery = query(collectionGroup(firestore, 'specialContributions'));
    const miscellaneousIncomesQuery = query(collection(firestore, 'miscellaneousIncomes'));

    const [allUsersSnapshot, contributionsSnapshot, specialContributionsSnapshot, miscIncomesSnapshot] = await Promise.all([
        getDocs(allUsersQuery).catch(e => { throw e; }),
        getDocs(contributionsQuery).catch(e => { throw e; }),
        getDocs(specialContributionsQuery).catch(e => { throw e; }),
        getDocs(miscellaneousIncomesQuery).catch(e => { throw e; }),
    ]);

    const allUsers = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    
    // Current members are non-Admins
    const currentMembers = allUsers.filter(user => user.role !== 'Admin');
    const currentMemberIds = new Set(currentMembers.map(m => m.id));

    const contributions = contributionsSnapshot.docs.map(doc => doc.data() as Contribution);
    const specialContributions = specialContributionsSnapshot.docs.map(doc => doc.data() as Contribution);
    const miscellaneousIncomes = miscIncomesSnapshot.docs.map(doc => doc.data() as MiscellaneousIncome);

    // Group funds are miscellaneous incomes.
    const miscTotal = miscellaneousIncomes.reduce((sum, income) => sum + income.amount, 0);

    const monthlyTotal = contributions.reduce((sum, c) => sum + c.amount, 0);
    const specialTotal = specialContributions.reduce((sum, sc) => sum + sc.amount, 0);

    const grandTotal = monthlyTotal + specialTotal + miscTotal;
    const numberOfMembers = currentMembers.length > 0 ? currentMembers.length : 1;
    
    const totalPooledFunds = miscTotal;
    const groupFundsShare = totalPooledFunds / numberOfMembers;

    if (grandTotal === 0) {
        return {
            memberShares: currentMembers.map(u => ({ ...u, personalContribution: 0, groupFundsShare: 0, totalShareValue: 0, sharePercentage: 0 })),
            grandTotal: 0,
            breakdown: { totalMiscIncomes: 0, totalFromDeletedUsers: 0, totalPooledFunds: 0, numberOfMembers: 0 }
        };
    }
    
    const memberPersonalTotals: Record<string, number> = {};
    contributions.forEach(c => {
        if (currentMemberIds.has(c.userId)) {
            memberPersonalTotals[c.userId] = (memberPersonalTotals[c.userId] || 0) + c.amount;
        }
    });
    specialContributions.forEach(sc => {
        if (currentMemberIds.has(sc.userId)) {
            memberPersonalTotals[sc.userId] = (memberPersonalTotals[sc.userId] || 0) + sc.amount;
        }
    });
    
    const memberShares = currentMembers.map(user => {
      const personalContribution = memberPersonalTotals[user.id] || 0;
      const totalShareValue = personalContribution + groupFundsShare;
      const sharePercentage = grandTotal > 0 ? (totalShareValue / grandTotal) * 100 : 0;
      
      return {
        ...user,
        personalContribution,
        groupFundsShare,
        totalShareValue,
        sharePercentage,
      };
    }).sort((a, b) => b.sharePercentage - a.sharePercentage);

    return { 
        memberShares, 
        grandTotal,
        breakdown: {
            totalMiscIncomes: miscTotal,
            totalFromDeletedUsers: 0,
            totalPooledFunds,
            numberOfMembers
        }
    };
}

export default function SharesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [sharesData, setSharesData] = useState<SharesData | null>(null);
  const [breakdown, setBreakdown] = useState<SharesBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string, link?: string, instructions?: string } | null>(null);

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'userProfiles', user.uid) : null), [firestore, user]);
  const { data: currentUserProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const isAdmin = currentUserProfile?.role === 'Admin';
  const initialLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    if (initialLoading || !firestore || !isAdmin) {
      if(!initialLoading && !isAdmin) {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    fetchAllDataForShares(firestore)
      .then(data => {
        setSharesData(data);
        setBreakdown(data.breakdown);
        setError(null);
      })
      .catch(err => {
        console.error("Error fetching shares data:", err);
        setError({ message: "An unexpected error occurred.", instructions: `Failed to fetch member shares data. You may not have the required permissions. ${err.message}` });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [initialLoading, isAdmin, firestore]);
  
  const chartData = useMemo(() => {
    if (!sharesData?.memberShares) return [];
    return sharesData.memberShares.map(member => ({
        name: `${member.firstName} ${member.lastName}`,
        share: member.sharePercentage,
        id: member.id
    }));
  }, [sharesData]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
        share: {
            label: "Share Percentage",
            color: "hsl(var(--primary))",
        }
    };
    return config;
  }, []);


  if (initialLoading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>This page is restricted to administrators.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">You do not have permission to view member shares.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {breakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Group Funds Breakdown</CardTitle>
            <CardDescription>
              Calculation of "Share of Group Funds" distributed equally across active members.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                <span>Total from Miscellaneous Incomes</span>
                <span className="font-bold">Ksh {breakdown.totalMiscIncomes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center p-2">
                <span className="font-semibold">Total Pooled Funds for Distribution</span>
                <span className="font-bold">Ksh {breakdown.totalPooledFunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center p-2 text-sm">
                <span className="text-muted-foreground italic">Divided by {breakdown.numberOfMembers} Members</span>
                <span className="text-muted-foreground font-medium">Ksh {(breakdown.totalPooledFunds / (breakdown.numberOfMembers || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Member Shares Ranking</CardTitle>
          <CardDescription>
            Members ranked by their total contribution share. Total group funds: <span className="font-bold text-primary">Ksh {sharesData?.grandTotal.toLocaleString() ?? 0}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead className="min-w-[200px]">Member</TableHead>
                  <TableHead className="min-w-[150px]">Personal Contributions</TableHead>
                  <TableHead className="min-w-[150px]">Group Share</TableHead>
                  <TableHead className="min-w-[150px]">Total Value</TableHead>
                  <TableHead className="min-w-[120px]">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sharesData && sharesData.memberShares.length > 0 ? (
                    sharesData.memberShares.map((member, index) => (
                  <TableRow key={member.id} className={index < 3 ? "bg-primary/5" : ""}>
                    <TableCell className="font-bold text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.photoURL} />
                          <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium whitespace-nowrap">{member.firstName} {member.lastName}</div>
                      </div>
                    </TableCell>
                    <TableCell>Ksh {member.personalContribution.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                    <TableCell>Ksh {member.groupFundsShare.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="font-semibold text-primary">Ksh {member.totalShareValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">{member.sharePercentage.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            No contribution data available.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {chartData.length > 0 && (
          <CardFooter className="flex-col items-stretch gap-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-center">Group Performance Chart</h3>
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig}>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ left: 40, right: 20 }}
                        barSize={32}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={120}
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="share" fill="var(--color-share)" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={index < 3 ? 'hsl(var(--accent))' : 'hsl(var(--primary))'} 
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}