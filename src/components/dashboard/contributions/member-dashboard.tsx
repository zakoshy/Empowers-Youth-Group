'use client';

import { useState, useMemo } from 'react';
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
    
    let calculatedTotalDebt = 0;
    for (let year = Math.min(...sortedYears); year <= currentYear; year++) {
        const contributionsThisYear = allContributions.filter(c => c.year === year).reduce((sum, c) => sum + c.amount, 0);
        calculatedTotalDebt += (annualTarget - contributionsThisYear);
    }

    const dataForSelectedYear = allContributions.reduce((acc, curr) => {
        if (curr.year === selectedYear) {
          acc[MONTHS[curr.month].toLowerCase()] = curr.amount;
        }
        return acc;
      }, {} as Record<string, number>);

    const totalContributionForSelectedYear = Object.values(dataForSelectedYear).reduce((sum, amount) => sum + amount, 0);
    
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
        <div className="space-y-6 w-full max-w-full overflow-x-hidden">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">My Contributions - {selectedYear}</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Your financial status overview.
              </CardDescription>
            </div>
             <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
             <Card className="p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Year</p>
                    <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <div className="text-xl font-bold truncate">Ksh {totalContributionForYear.toLocaleString()}</div>
                    <p className="text-[10px] text-muted-foreground">Target: Ksh {annualTarget.toLocaleString()}</p>
                </div>
            </Card>
             <Card className="p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding</p>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <div>
                    <div className="text-xl font-bold truncate">Ksh {totalDebt > 0 ? totalDebt.toLocaleString() : 0}</div>
                     <p className="text-[10px] text-muted-foreground">Across all years</p>
                </div>
            </Card>
             <Card className="p-4">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Miniharambees</p>
                    <Gift className="h-4 w-4 text-accent" />
                </div>
                <div>
                    <div className="text-xl font-bold truncate">Ksh {totalSpecialContribution.toLocaleString()}</div>
                     <p className="text-[10px] text-muted-foreground">Total raised</p>
                </div>
            </Card>
            <Card className="p-4 bg-primary/5">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grand Total</p>
                    <Banknote className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <div className="text-xl font-bold truncate text-primary">Ksh {grandTotal.toLocaleString()}</div>
                     <p className="text-[10px] text-muted-foreground">All contributions</p>
                </div>
            </Card>
          </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-medium">
                    <span>{selectedYear} Progress</span>
                    <span>{progressPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercentage} className="w-full h-2" />
            </div>
        </CardContent>
      </Card>
      
      <Card className="w-full overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Detailed Breakdown for {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="overflow-x-auto w-full">
              <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead className="w-[100px]">Month</TableHead>
                      <TableHead className="w-[150px]">Contribution</TableHead>
                      <TableHead className="min-w-[200px]">Miniharambee Details</TableHead>
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
                              <div className="flex flex-col gap-1">
                                  <span className="text-sm font-semibold">Ksh {amount.toLocaleString()}</span>
                                  {isPaid ? (
                                      <Badge variant="default" className="w-fit text-[10px] px-1.5 py-0">Paid</Badge>
                                  ) : isPartial ? (
                                      <Badge variant="accent" className="w-fit text-[10px] px-1.5 py-0">Partial</Badge>
                                  ) : (
                                      <Badge variant="destructive" className="w-fit text-[10px] px-1.5 py-0">Unpaid</Badge>
                                  )}
                              </div>
                          </TableCell>
                          <TableCell>
                              {specialCons.length > 0 ? (
                                  <div className="space-y-2">
                                      {specialCons.map(sc => (
                                          <div key={sc.id} className="flex items-center gap-2 text-xs">
                                              <Gift className="h-3 w-3 text-accent shrink-0" />
                                              <div className="flex flex-wrap gap-x-1">
                                                <span className="font-bold">Ksh {sc.amount.toLocaleString()}</span>
                                                <span className="text-muted-foreground">({format(new Date(sc.date), "MMM d")})</span>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <p className="text-xs text-muted-foreground italic">No special contributions</p>
                              )}
                          </TableCell>
                      </TableRow>
                      );
                  })}
                  </TableBody>
              </Table>
            </div>
          </CardContent>
      </Card>
    </div>
  );
}
