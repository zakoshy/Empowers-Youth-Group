'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import type { InvestmentReport } from '@/lib/data';

function ViewReportContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');
  const firestore = useFirestore();

  const reportRef = useMemoFirebase(
    () => (reportId ? doc(firestore, 'investmentReports', reportId) : null),
    [firestore, reportId]
  );
  const { data: report, isLoading } = useDoc<InvestmentReport>(reportRef);
  
  if (isLoading) {
    return (
       <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The requested report could not be found. It may have been deleted.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{report.title}</CardTitle>
        <CardDescription>
          Uploaded on {format(new Date(report.uploadDate), 'PPP')}
        </CardDescription>
      </CardHeader>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <CardContent>
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
            {report.content}
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  )
}

export default function ViewReportPage() {
    return (
        <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <ViewReportContent />
        </Suspense>
    )
}
