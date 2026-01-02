'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MONTHS, FINANCIAL_CONFIG } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Gift, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Contribution {
  id: string; 
  month: number;
  amount: number;
  year: number;
}

interface SpecialContribution {
    id: string;
    date: string;
    amount: number;
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

  const { data: allContributions, isLoading: contributionsLoading } = useCollection<Contribution>(contributionsRef);
  const { data: allSpecialContributions, isLoading: specialContributionsLoading } = useCollection<SpecialContribution>(specialContributionsRef);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);

  const { yearlyData, totalContributionForYear, totalDebt, grandTotal, totalSpecialContribution } = useMemo(() => {
    if (!allContributions || !allSpecialContributions) {
        return { yearlyData: {}, totalContributionForYear: 0, totalDebt: 0, grandTotal: 0, totalSpecialContribution: 0 };
    }

    const years = new Set<number>([currentYear]);
    allContributions.forEach(c => years.add(c.year));
    allSpecialContributions.forEach(sc => years.add(sc.year));
    const sortedYears = Array.from(years).sort((a,b) => b-a);
    if(availableYears.length !== sortedYears.length) {
        setAvailableYears(sortedYears);
    }
    
    // Calculate total debt up to the current year
    let calculatedTotalDebt = 0;
    for (let year = Math.min(...sortedYears); year <= currentYear; year++) {
        const contributionsThisYear = allContributions.filter(c => c.year === year).reduce((sum, c) => sum + c.amount, 0);
        calculatedTotalDebt += (annualTarget - contributionsThisYear);
    }

    // Data for selected year
    const dataForSelectedYear = allContributions.reduce((acc, curr) => {
        if (curr.year === selectedYear) {
          acc[MONTHS[curr.month].toLowerCase()] = curr.amount;
        }
        return acc;
      }, {} as Record<string, number>);

    const totalContributionForSelectedYear = Object.values(dataForSelectedYear).reduce((sum, amount) => sum + amount, 0);
    
    // Grand totals for all time
    const allTimeMonthlyTotal = allContributions.reduce((sum, c) => sum + c.amount, 0);
    const allTimeSpecialTotal = allSpecialContributions.reduce((sum, sc) => sum + sc.amount, 0);


    return { 
        yearlyData: dataForSelectedYear,
        totalContributionForYear: totalContributionForSelectedYear,
        totalDebt: calculatedTotalDebt,
        grandTotal: allTimeMonthlyTotal + allTimeSpecialTotal,
        totalSpecialContribution: allTimeSpecialTotal
    };

  }, [allContributions, allSpecialContributions, selectedYear, availableYears]);
  
  const monthlySpecialContributions = useMemo(() => {
    const monthly: Record<string, SpecialContribution[]> = {};
    if (allSpecialContributions) {
      allSpecialContributions.forEach(sc => {
        if (sc.year === selectedYear) {
          const monthName = MONTHS[sc.month];
          if (!monthly[monthName]) {
            monthly[monthName] = [];
          }
          monthly[monthName].push(sc);
        }
      });
    }
    return monthly;
  }, [allSpecialContributions, selectedYear]);

  const progressPercentage = (totalContributionForYear / annualTarget) * 100;

  const isLoading = contributionsLoading || specialContributionsLoading;

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Contributions - {selectedYear}</CardTitle>
              <CardDescription>
                A summary of your financial status.
              </CardDescription>
            </div>
             <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Contributions This Year</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Ksh {totalContributionForYear.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">out of Ksh {annualTarget.toLocaleString()}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Outstanding Debt</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Ksh {totalDebt > 0 ? totalDebt.toLocaleString() : 0}</div>
                     <p className="text-xs text-muted-foreground">across all years</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">All-Time Miniharambees</CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Ksh {totalSpecialContribution.toLocaleString()}</div>
                     <p className="text-xs text-muted-foreground">total raised</p>
                </CardContent>
            </Card>
            <Card className="bg-primary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">All-Time Grand Total</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Ksh {grandTotal.toLocaleString()}</div>
                     <p className="text-xs text-muted-foreground">all contributions</p>
                </CardContent>
            </Card>
          </div>
            <div className="space-y-2">
                <p className="text-sm font-medium">{selectedYear} Contribution Progress</p>
                <Progress value={progressPercentage} className="w-full" />
                <p className="text-xs text-muted-foreground text-right">{progressPercentage.toFixed(0)}% complete</p>
            </div>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Detailed Breakdown for {selectedYear}</CardTitle>
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
              {MONTHS.map((month) => {
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
                                      <li key={sc.id} className="flex items-center gap-2">
                                          <Gift className="h-4 w-4 text-primary" />
                                          <div>
                                            <span className="font-semibold">Ksh {sc.amount.toLocaleString()}</span> - <span className="text-muted-foreground">on {format(new Date(sc.date), "MMM d, yyyy")}</span>
                                          </div>
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
