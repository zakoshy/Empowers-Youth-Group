
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, TrendingDown, Scale, Calendar, Gift, Banknote } from "lucide-react";
import { FINANCIAL_CONFIG } from "@/lib/data";

interface Contribution {
  year: number;
  amount: number;
}

interface SpecialContribution {
    year: number;
    amount: number;
}

export function StatsCards() {
  const { user } = useUser();
  const firestore = useFirestore();

  const currentYear = new Date().getFullYear();
  const annualTarget = FINANCIAL_CONFIG.MONTHLY_CONTRIBUTION * 12;

  const contributionsRef = useMemoFirebase(
    () => user ? collection(firestore, 'userProfiles', user.uid, 'contributions') : null,
    [firestore, user]
  );

  const specialContributionsRef = useMemoFirebase(
    () => user ? collection(firestore, 'userProfiles', user.uid, 'specialContributions') : null,
    [firestore, user]
  );
  
  const { data: contributions, isLoading: contributionsLoading } = useCollection<Contribution>(contributionsRef);
  const { data: specialContributions, isLoading: specialContributionsLoading } = useCollection<SpecialContribution>(specialContributionsRef);
  
  const [totalContribution, setTotalContribution] = useState(0);
  const [totalSpecialContribution, setTotalSpecialContribution] = useState(0);
  const [outstandingDebt, setOutstandingDebt] = useState(annualTarget);

  useEffect(() => {
    if (contributions) {
      const currentYearContributions = contributions.filter(c => c.year === currentYear);
      const total = currentYearContributions.reduce((acc, curr) => acc + curr.amount, 0);
      setTotalContribution(total);
      setOutstandingDebt(annualTarget - total);
    } else {
        setTotalContribution(0);
        setOutstandingDebt(annualTarget);
    }
  }, [contributions, annualTarget]);

  useEffect(() => {
    if (specialContributions) {
        const currentYearSpecialContributions = specialContributions.filter(sc => sc.year === currentYear);
        const total = currentYearSpecialContributions.reduce((sum, sc) => sum + sc.amount, 0);
        setTotalSpecialContribution(total);
    }
  }, [specialContributions]);

  const isLoading = contributionsLoading || specialContributionsLoading;
  const grandTotal = totalContribution + totalSpecialContribution;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  const getNextDueDate = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0);
    
    // If today is past the due date of current month, show next month's due date
    const currentMonthDueDate = new Date(today.getFullYear(), today.getMonth(), 30);
    if(today > currentMonthDueDate) {
      const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 30);
       return nextMonthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    return currentMonthDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Monthly Contribution ({currentYear})
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Ksh {totalContribution.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            out of Ksh {annualTarget.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Outstanding Debt ({currentYear})
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Ksh {outstandingDebt.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Remaining for monthly goal
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Amount</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Ksh {FINANCIAL_CONFIG.MONTHLY_CONTRIBUTION.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Your fixed monthly amount
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Miniharambees ({currentYear})</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Ksh {totalSpecialContribution.toLocaleString()}
          </div>
           <p className="text-xs text-muted-foreground">Total special contributions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Due Date</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {getNextDueDate()}
          </div>
          <p className="text-xs text-muted-foreground">
            For the next contribution cycle
          </p>
        </CardContent>
      </Card>
        <Card className="bg-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Grand Total ({currentYear})</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Ksh {grandTotal.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">monthly + miniharambees</p>
            </CardContent>
        </Card>
    </div>
  )
}
