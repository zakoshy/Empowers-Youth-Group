import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { memberData } from "@/lib/data";

export function StatsCards() {
  const { totalContribution, outstandingDebt, monthlyContribution } = memberData.financialSummary;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Contribution ({memberData.financialSummary.year})
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
            Outstanding Debt ({memberData.financialSummary.year})
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
            Ksh {monthlyContribution.toLocaleString()}
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
            Sept 30, 2024
          </div>
          <p className="text-xs text-muted-foreground">
            For the month of September
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
