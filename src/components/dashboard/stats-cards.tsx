
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
import { DollarSign, TrendingUp, TrendingDown, Scale, Calendar } from "lucide-react";
import { FINANCIAL_CONFIG } from "@/lib/data";

interface Contribution {
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
  
  const { data: contributions, isLoading } = useCollection<Contribution>(contributionsRef);
  
  const [totalContribution, setTotalContribution] = useState(0);
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

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Contribution ({currentYear})
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Ksh {totalContribution.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Your total contribution for the year
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
            Remaining amount for the year
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Contribution</CardTitle>
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
    </div>
  )
}
