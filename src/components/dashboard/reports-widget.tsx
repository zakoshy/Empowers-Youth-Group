import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { investmentReports } from "@/lib/data"
import { Button } from "../ui/button"
import { FileText } from "lucide-react"

export function ReportsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Reports</CardTitle>
        <CardDescription>
          Latest updates on our group investments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investmentReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.title}</TableCell>
                <TableCell>{report.date}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    <FileText className="h-3 w-3 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
