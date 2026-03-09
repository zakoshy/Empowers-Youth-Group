'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Scale, Calendar, Gift, Banknote } from "lucide-react";
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

  const [isLoading, setIsLoading] = useState(true);
  const [totalContribution, setTotalContribution] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalSpecialContribution, setTotalSpecialContribution] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const contributionsRef = collection(firestore, 'userProfiles', user.uid, 'contributions');
            const specialContributionsRef = collection(firestore, 'userProfiles', user.uid, 'specialContributions');
            
            const [contributionsSnapshot, specialContributionsSnapshot] = await Promise.all([
                getDocs(query(contributionsRef)),
                getDocs(query(specialContributionsRef)),
            ]);

            const allContributions: Contribution[] = contributionsSnapshot.docs.map(d => d.data() as Contribution);
            const allSpecialContributions: SpecialContribution[] = specialContributionsSnapshot.docs.map(d => d.data() as SpecialContribution);

            const years = new Set<number>([currentYear]);
            allContributions.forEach(c => years.add(c.year));

            let calculatedTotalDebt = 0;
            for (let year = Math.min(...Array.from(years)); year <= currentYear; year++) {
                const contributionsThisYear = allContributions.filter(c => c.year === year).reduce((sum, c) => sum + c.amount, 0);
                calculatedTotalDebt += (annualTarget - contributionsThisYear);
            }
            setTotalDebt(calculatedTotalDebt > 0 ? calculatedTotalDebt : 0);

            const currentYearContributions = allContributions.filter(c => c.year === currentYear);
            const totalForCurrentYear = currentYearContributions.reduce((acc, curr) => acc + curr.amount, 0);
            setTotalContribution(totalForCurrentYear);

            const allTimeSpecialTotal = allSpecialContributions.reduce((sum, sc) => sum + sc.amount, 0);
            setTotalSpecialContribution(allTimeSpecialTotal);

            const allTimeMonthlyTotal = allContributions.reduce((sum, c) => sum + c.amount, 0);
            setGrandTotal(allTimeMonthlyTotal + allTimeSpecialTotal);

        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setIsLoading(false);
        }
    }

    fetchData();

  }, [user, firestore, currentYear, annualTarget]);


  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  const getNextDueDate = () => {
    const today = new Date();
    const currentMonthDueDate = new Date(today.getFullYear(), today.getMonth(), 30);
    if(today > currentMonthDueDate) {
      const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 30);
       return nextMonthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return currentMonthDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-full">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium">
            Contribution ({currentYear})
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl sm:text-2xl font-bold truncate">
            Ksh {totalContribution.toLocaleString()}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            out of Ksh {annualTarget.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium">
            Outstanding Debt
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl sm:text-2xl font-bold truncate">
            Ksh {totalDebt.toLocaleString()}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            Cumulative total
          </p>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium">Monthly Amount</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl sm:text-2xl font-bold truncate">
            Ksh {FINANCIAL_CONFIG.MONTHLY_CONTRIBUTION.toLocaleString()}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            Fixed monthly requirement
          </p>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium">Miniharambees</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl sm:text-2xl font-bold truncate">
            Ksh {totalSpecialContribution.toLocaleString()}
          </div>
           <p className="text-[10px] sm:text-xs text-muted-foreground truncate">All-time special</p>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-sm font-medium">Next Due Date</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl sm:text-2xl font-bold truncate">
            {getNextDueDate()}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            Next cycle deadline
          </p>
        </CardContent>
      </Card>
        <Card className="bg-primary/10 w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium">Grand Total</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold truncate">Ksh {grandTotal.toLocaleString()}</div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">All contributions made</p>
            </CardContent>
        </Card>
    </div>
  )
}
