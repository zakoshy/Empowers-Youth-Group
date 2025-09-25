import Image from "next/image";
import { format } from "date-fns";
import { Calendar, MapPin } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Event } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "./ui/button";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const eventImage = PlaceHolderImages.find((img) => img.id === event.image);

  return (
    <Card className="flex flex-col">
      <div className="relative w-full h-48">
        {eventImage && (
          <Image
            src={eventImage.imageUrl}
            alt={eventImage.description}
            fill
            className="object-cover rounded-t-lg"
            data-ai-hint={eventImage.imageHint}
          />
        )}
      </div>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{event.title}</CardTitle>
        <CardDescription className="pt-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(event.date), "MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">{event.description}</p>
      </CardContent>
    </Card>
  );
}
