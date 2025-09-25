import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { events } from "@/lib/data"
import { format } from "date-fns"

export function EventsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Stay informed about group activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="flex items-center gap-4">
              <div className="bg-muted text-muted-foreground rounded-lg p-3 flex flex-col items-center justify-center">
                <span className="text-sm font-bold">{format(new Date(event.date), 'MMM')}</span>
                <span className="text-xl font-bold">{format(new Date(event.date), 'd')}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.location}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
