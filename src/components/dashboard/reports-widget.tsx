'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, limit, orderBy, query } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { FileText, Download } from "lucide-react";

interface InvestmentReport {
  id: string;
  title: string;
  uploadDate: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
}

export function ReportsWidget() {
  const firestore = useFirestore();
  const reportsRef = useMemoFirebase(() => query(
    collection(firestore, 'investmentReports'), 
    orderBy('uploadDate', 'desc'),
    limit(5)
  ), [firestore]);
  const { data: reports, isLoading } = useCollection<InvestmentReport>(reportsRef);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Reports</CardTitle>
        <CardDescription>
          Latest updates on our group investments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            {reports && reports.length > 0 ? (
                reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                            <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold truncate">{report.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    Uploaded: {format(new Date(report.uploadDate), 'MMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                        {report.fileUrl ? (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" download={report.fileName}>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" asChild>
                              <a href={`/dashboard/reports/view?id=${report.id}`} target="_blank" rel="noopener noreferrer">
                               View
                             </a>
                          </Button>
                        )}
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No investment reports have been uploaded yet.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
