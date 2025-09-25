import { events } from "@/lib/data";
import { EventCard } from "@/components/event-card";

export default function EventsPage() {
  return (
    <div className="container py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-headline font-bold">Upcoming Events</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          Join us for our upcoming events. Get involved, learn new skills, and connect with the community.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
