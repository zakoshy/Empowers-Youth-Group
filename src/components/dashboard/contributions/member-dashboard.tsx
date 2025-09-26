
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MONTHS, FINANCIAL_CONFIG } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Gift } from 'lucide-react';
import { format } from 'date-fns';

interface Contribution {
  id: string; // month_year e.g., 'january_2024'
  month: number;
  amount: number;
  year: number;
}

interface SpecialContribution {
    id: string;
    date: string;
    amount: number;
    description: string;
    month: number;
    year: number;
}

interface MemberDashboardProps {
  userId: string;
}

const currentYear = new Date().getFullYear();
const annualTarget = FINANCIAL_CONFIG.MONTHLY_CONTRIBUTION * 12;

export default function MemberDashboard({ userId }: MemberDashboardProps) {
  const firestore = useFirestore();

  const contributionsRef = useMemoFirebase(
    () => collection(firestore, 'userProfiles', userId, 'contributions'),
    [firestore, userId]
  );
  const specialContributionsRef = useMemoFirebase(
    () => query(collection(firestore, 'userProfiles', userId, 'specialContributions'), orderBy('date', 'desc')),
    [firestore, userId]
  );

  const { data: contributions, isLoading: contributionsLoading } = useCollection<Contribution>(contributionsRef);
  const { data: specialContributions, isLoading: specialContributionsLoading } = useCollection<SpecialContribution>(specialContributionsRef);

  const [yearlyData, setYearlyData] = useState<Record<string, number>>({});
  const [totalContribution, setTotalContribution] = useState(0);
  const [totalSpecialContribution, setTotalSpecialContribution] = useState(0);

  useEffect(() => {
    if (contributions) {
      const dataForYear = contributions.reduce((acc, curr) => {
        if (curr.year === currentYear) {
          acc[MONTHS[curr.month].toLowerCase()] = curr.amount;
        }
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(dataForYear).reduce((sum, amount) => sum + amount, 0);
      
      setYearlyData(dataForYear);
      setTotalContribution(total);
    }
  }, [contributions]);

  useEffect(() => {
    if (specialContributions) {
        const currentYearSpecialContributions = specialContributions.filter(sc => sc.year === currentYear);
        const total = currentYearSpecialContributions.reduce((sum, sc) => sum + sc.amount, 0);
        setTotalSpecialContribution(total);
    }
  }, [specialContributions]);
  
  const monthlySpecialContributions = useMemo(() => {
    const monthly: Record<string, SpecialContribution[]> = {};
    if (specialContributions) {
      specialContributions.forEach(sc => {
        if (sc.year === currentYear) {
          const monthName = MONTHS[sc.month];
          if (!monthly[monthName]) {
            monthly[monthName] = [];
          }
          monthly[monthName].push(sc);
        }
      });
    }
    return monthly;
  }, [specialContributions]);

  const outstandingDebt = annualTarget - totalContribution;
  const progressPercentage = (totalContribution / annualTarget) * 100;

  const isLoading = contributionsLoading || specialContributionsLoading;

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Contributions - {currentYear}</CardTitle>
          <CardDescription>
            A summary of your financial status for the current year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Contributions</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Ksh {totalContribution.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">out of Ksh {annualTarget.toLocaleString()}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding Debt</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Ksh {outstandingDebt.toLocaleString()}</div>
                     <p className="text-xs text-muted-foreground">for monthly contributions</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Miniharambees</CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Ksh {totalSpecialContribution.toLocaleString()}</div>
                     <p className="text-xs text-muted-foreground">total raised this year</p>
                </CardContent>
            </Card>
          </div>
            <div className="space-y-2">
                <p className="text-sm font-medium">Yearly Contribution Progress</p>
                <Progress value={progressPercentage} className="w-full" />
                <p className="text-xs text-muted-foreground text-right">{progressPercentage.toFixed(0)}% complete</p>
            </div>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Detailed Breakdown by Month</CardTitle>
          </CardHeader>
          <CardContent>
          <Table>
              <TableHeader>
              <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Contribution Status</TableHead>
                  <TableHead>Miniharambee Details</TableHead>
              </TableRow>
              </TableHeader>
              <TableBody>
              {MONTHS.map((month, monthIndex) => {
                  const amount = yearlyData[month.toLowerCase()] || 0;
                  const isPaid = amount >= FINANCIAL_CONFIG.MONTHLY_CONTRIBUTION;
                  const isPartial = amount > 0 && amount < FINANCIAL_CONFIG.MONTHLY_CONTRIBUTION;
                  const specialCons = monthlySpecialContributions[month] || [];
                  
                  return (
                  <TableRow key={month}>
                      <TableCell className="font-medium">{month}</TableCell>
                      <TableCell>
                          <div className="flex flex-col">
                              <span>Ksh {amount.toLocaleString()}</span>
                              {isPaid ? (
                                  <Badge variant="default" className="bg-green-500 w-fit mt-1">Paid</Badge>
                              ) : isPartial ? (
                                  <Badge variant="secondary" className="bg-yellow-500 w-fit mt-1">Partial</Badge>
                              ) : (
                                  <Badge variant="destructive" className="w-fit mt-1">Unpaid</Badge>
                              )}
                          </div>
                      </TableCell>
                      <TableCell>
                          {specialCons.length > 0 ? (
                              <ul className="space-y-1 text-sm">
                                  {specialCons.map(sc => (
                                      <li key={sc.id}>
                                          <span className="font-semibold">Ksh {sc.amount.toLocaleString()}</span> - <span className="text-muted-foreground">{sc.description}</span>
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <p className="text-sm text-muted-foreground">None</p>
                          )}
                      </TableCell>
                  </TableRow>
                  );
              })}
              </TableBody>
          </Table>
          </CardContent>
      </Card>
    </div>
  );
}

    