import { StatsCards } from "@/components/dashboard/stats-cards";
import { EventsWidget } from "@/components/dashboard/events-widget";
import { ReportsWidget } from "@/components/dashboard/reports-widget";
import { PollsWidget } from "@/components/dashboard/polls-widget";
import { PersonalizedSuggestions } from "@/components/dashboard/personalized-suggestions";
import { memberData, constitution } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome, {memberData.name}!</h1>
        <p className="text-muted-foreground">Here's a summary of your activities and group updates.</p>
      </div>

      <StatsCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-6">
            <PersonalizedSuggestions />
            <ReportsWidget />
        </div>
        <div className="lg:col-span-1 grid gap-6">
            <EventsWidget />
            <PollsWidget />
        </div>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Group Constitution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The guiding document for our group. Last updated: {constitution.lastUpdated}
          </p>
          <Button asChild variant="outline">
            <Link href={constitution.url} target="_blank">
                <FileText className="mr-2 h-4 w-4" />
                View Constitution
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
