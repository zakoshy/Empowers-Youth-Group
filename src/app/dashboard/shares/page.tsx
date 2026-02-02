
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { MiscellaneousIncome } from '@/lib/data';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell } from 'recharts';

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

interface SharesData {
    memberShares: (UserProfile & { totalContribution: number; sharePercentage: number })[];
    grandTotal: number;
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

    // Identify contributions from users who have been deleted.
    const allContributingUserIds = new Set<string>();
    contributions.forEach(c => allContributingUserIds.add(c.userId));
    specialContributions.forEach(sc => allContributingUserIds.add(sc.userId));
    
    const adminUserIds = new Set(allUsers.filter(u => u.role === 'Admin').map(u => u.id));

    const deletedUserIds = [...allContributingUserIds].filter(id => !currentMemberIds.has(id) && !adminUserIds.has(id));

    let totalFromDeletedUsers = 0;
    contributions.forEach(c => {
        if (deletedUserIds.includes(c.userId)) {
            totalFromDeletedUsers += c.amount;
        }
    });
    specialContributions.forEach(sc => {
        if (deletedUserIds.includes(sc.userId)) {
            totalFromDeletedUsers += sc.amount;
        }
    });

    const monthlyTotal = contributions.reduce((sum, c) => sum + c.amount, 0);
    const specialTotal = specialContributions.reduce((sum, sc) => sum + sc.amount, 0);
    const miscTotal = miscellaneousIncomes.reduce((sum, income) => sum + income.amount, 0);

    const grandTotal = monthlyTotal + specialTotal + miscTotal;
    const numberOfMembers = currentMembers.length > 0 ? currentMembers.length : 1;
    
    // Calculate equal shares from misc income and deleted members' funds.
    const equalShareFromMisc = miscTotal / numberOfMembers;
    const redistributedAmountPerMember = totalFromDeletedUsers / numberOfMembers;

    if (grandTotal === 0) {
        return {
            memberShares: currentMembers.map(u => ({ ...u, totalContribution: 0, sharePercentage: 0 })),
            grandTotal: 0,
        };
    }
    
    // Calculate personal totals for current members only.
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
      const totalEffectiveContribution = personalContribution + equalShareFromMisc + redistributedAmountPerMember;
      const sharePercentage = grandTotal > 0 ? (totalEffectiveContribution / grandTotal) * 100 : 0;
      
      return {
        ...user,
        totalContribution: totalEffectiveContribution,
        sharePercentage,
      };
    }).sort((a, b) => b.sharePercentage - a.sharePercentage);

    return { memberShares, grandTotal };
}

export default function SharesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [sharesData, setSharesData] = useState<SharesData | null>(null);
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
        setError(null);
      })
      .catch(err => {
        console.error("Error fetching shares data:", err);
        
        if (err.code === 'failed-precondition' && err.message.includes('index')) {
            const urlMatch = err.message.match(/(https?:\/\/[^\s]+)/);
            const isNotReady = err.message.includes('not ready yet');
            const isContributionsIndex = err.message.includes('collection contributions');
            const isSpecialContributionsIndex = err.message.includes('collection specialContributions');
            
            let instructions = `This feature requires a database index. Please click the link to create it, wait a few minutes for it to build, then refresh the page.`;
            let errorMessage = `Action Required: Database Index Needed`;

            if (isNotReady) {
                instructions = `The required database index for ${isContributionsIndex ? 'contributions' : 'special contributions'} is still being built. This can take a few minutes. Please wait and then refresh the page.`;
                errorMessage = `Action Required: Database Index Building`;
            } else if (isContributionsIndex) {
                 instructions = `This page requires an index for regular contributions. Click the link to create it, wait a few minutes, then refresh.`;
                 errorMessage = `Missing Index for Contributions`;
            } else if (isSpecialContributionsIndex) {
                instructions = `This page requires an index for special contributions. Click the link to create it, wait a few minutes, then refresh.`;
                errorMessage = `Missing Index for Special Contributions`;
            }

            setError({ 
                message: errorMessage,
                instructions,
                link: urlMatch ? urlMatch[0] : undefined
            });

        } else {
             setError({ message: "An unexpected error occurred.", instructions: `Failed to fetch member shares data. You may not have the required permissions. ${err.message}` });
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [initialLoading, isAdmin, firestore]);
  
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    if (sharesData?.memberShares) {
      sharesData.memberShares.forEach((member, index) => {
        config[member.id] = {
          label: `${member.firstName} ${member.lastName}`,
          color: `hsl(var(--chart-${(index % 5) + 1}))`,
        };
      });
    }
    return config;
  }, [sharesData]);


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

  if (error) {
    return (
        <Card>
          <CardHeader>
            <CardTitle>All-Time Member Shares</CardTitle>
            <CardDescription>
                An overview of each member's total contribution share.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{error.message}</AlertTitle>
            <AlertDescription>
                {error.instructions}
                {error.link && (
                    <Button asChild className="mt-4">
                        <a href={error.link} target="_blank" rel="noopener noreferrer">
                            Create/View Firestore Index
                        </a>
                    </Button>
                )}
            </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All-Time Member Shares</CardTitle>
          <CardDescription>
            An overview of each member's total contribution share. Total collected funds: <span className="font-bold text-primary">Ksh {sharesData?.grandTotal.toLocaleString() ?? 0}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Member</TableHead>
                <TableHead>Total Share Value</TableHead>
                <TableHead className="w-[300px]">Share Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sharesData && sharesData.memberShares.length > 0 ? (
                  sharesData.memberShares.map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.photoURL} />
                        <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{member.firstName} {member.lastName}</div>
                    </div>
                  </TableCell>
                  <TableCell>Ksh {member.totalContribution.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress value={member.sharePercentage} className="w-40" />
                      <span className="text-sm font-medium">{member.sharePercentage.toFixed(2)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              ) : (
                  <TableRow>
                      <TableCell colSpan={3} className="text-center">
                          No contribution data available.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {sharesData && sharesData.memberShares.length > 0 && (
          <CardFooter className="flex-col items-center gap-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-center">Shares Distribution</h3>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[350px] w-full max-w-[350px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent
                    nameKey="id"
                    formatter={(value, name, item) => (
                      <div className="text-sm">
                          <div className="font-bold">{chartConfig[name]?.label}</div>
                          <div className="text-muted-foreground">Share: {Number(value).toFixed(2)}%</div>
                      </div>
                  )} />}
                />
                <Pie
                  data={sharesData.memberShares}
                  dataKey="sharePercentage"
                  nameKey="id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  strokeWidth={2}
                >
                  {sharesData.memberShares.map((entry) => (
                    <Cell key={`cell-${entry.id}`} fill={`var(--color-${entry.id})`} className="stroke-background hover:opacity-80" />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="id" />}
                  className="mt-4 flex-wrap justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
