
'use client'

import Image from "next/image";
import Link from "next/link";
import { useState } from 'react';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, TrendingUp, Calendar, Target, Eye, Gem } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import type { Event } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === "hero");
  const aboutImage = PlaceHolderImages.find((img) => img.id === "about-story");
  const missionVisionImage = PlaceHolderImages.find((img) => img.id === "mission-vision");
  const aboutStoryImage = PlaceHolderImages.find((img) => img.id === "about-story");

  const firestore = useFirestore();
  const [now] = useState(() => new Date().toISOString());

  const upcomingEventsRef = useMemoFirebase(() => query(
    collection(firestore, 'events'),
    where('date', '>=', now),
    orderBy('date', 'asc')
  ), [firestore, now]);

  const pastEventsRef = useMemoFirebase(() => query(
    collection(firestore, 'events'),
    where('date', '<', now),
    orderBy('date', 'desc')
  ), [firestore, now]);

  const { data: upcomingEvents, isLoading: upcomingEventsLoading } = useCollection<Event>(upcomingEventsRef);
  const { data: pastEvents, isLoading: pastEventsLoading } = useCollection<Event>(pastEventsRef);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[80vh] w-full">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            data-ai-hint={heroImage.imageHint}
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative container mx-auto h-full flex flex-col items-center justify-center text-center text-white">
          <h1 className="text-4xl md:text-7xl font-headline font-bold">
            Empowering Youth, Building Community
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl">
            From shared hardship to a beacon of hope, The Empowers youth group is a youth-led initiative dedicated to giving back and uplifting our society.
          </p>
          <div className="mt-8 flex gap-4">
            <Button size="lg" asChild style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
              <Link href="/register">Join Us</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="#about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-semibold">What We Do</h2>
            <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
              We focus on three core pillars to create sustainable growth and opportunity within our community.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">Community Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Engaging in impactful projects that address local needs and foster a spirit of togetherness.</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">Shared Investments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Pooling resources to invest in sustainable ventures that generate returns for the group and fund our mission.</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg_primary/10 p-4 rounded-full w-fit">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">Events &amp; Workshops</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Organizing events that promote learning, collaboration, and personal development for all members.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24">
        <div className="container py-12 md:py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-headline font-bold">Our Story</h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              A journey of resilience, unity, and the drive to create lasting change.
            </p>
          </div>
          <Card className="overflow-hidden">
            <CardContent className="p-0 md:p-6 md:grid md:grid-cols-5 md:gap-10">
              <div className="md:col-span-2">
                {aboutStoryImage && (
                  <Image
                    src={aboutStoryImage.imageUrl}
                    alt={aboutStoryImage.description}
                    width={600}
                    height={400}
                    className="w-full h-64 md:h-full object-cover rounded-t-lg md:rounded-lg"
                    data-ai-hint={aboutStoryImage.imageHint}
                  />
                )}
              </div>
              <div className="p-6 md:p-0 md:col-span-3 flex flex-col justify-center">
                <h2 className="text-2xl font-headline font-semibold">From Hardship to Hope</h2>
                <p className="mt-4 text-muted-foreground">
                  EmpowerHub began not as an organization, but as a conversation among friends. We were a group of youths from the same village, each of us having navigated the challenges of limited opportunities and economic hardship. We had seen firsthand how talent and ambition could be stifled by circumstance. But we had also seen the power of community, of neighbors helping neighbors, and of shared determination.
                </p>
                <p className="mt-4 text-muted-foreground">
                  Having found our own paths to stability, we felt a collective responsibility to return to our roots and build the support system we wished we'd had. We decided to pool our resources, knowledge, and energy to create a platform for the next generation.
                </p>
                <h2 className="mt-8 text-2xl font-headline font-semibold">The Birth of EmpowerHub</h2>
                <p className="mt-4 text-muted-foreground">
                  In 2022, we formalized our efforts and established EmpowerHub. Our founding principle was simple: to create a self-sustaining cycle of empowerment. By investing together in small-scale ventures, we could generate funds to support community projects, educational scholarships, and skills training workshops.
                </p>
                <p className="mt-4 text-muted-foreground">
                  Today, EmpowerHub is more than just a group; it's a movement. It's a testament to the idea that with unity and a shared vision, a small community can achieve extraordinary things. We are run by the youth, for the youth, and we are committed to writing a new story for our village—one of prosperity, opportunity, and empowerment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section id="mission" className="bg-card">
        <div className="py-16 md:py-24">
          <div className="container mx-auto grid md:grid-cols-2 gap-10">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Target className="w-12 h-12 text-primary" />
                <CardTitle className="font-headline text-3xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground">
                  To empower the youth of our community by fostering economic independence, social responsibility, and personal growth through collaborative projects and shared investments.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Eye className="w-12 h-12 text-primary" />
                <CardTitle className="font-headline text-3xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground">
                  We envision a thriving, self-reliant community where every young person has the tools, support, and opportunity to achieve their full potential and contribute to a prosperous society.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="py-16 md:py-24">
          <div className="container mx-auto">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-headline font-semibold">Our Core Values</h2>
              <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
                The principles that guide every decision we make and action we take.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <Gem className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-4 font-bold text-lg">Unity</h3>
                <p className="mt-1 text-muted-foreground">We are stronger together. Collaboration is at the heart of all we do.</p>
              </div>
              <div className="text-center">
                <Gem className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-4 font-bold text-lg">Integrity</h3>
                <p className="mt-1 text-muted-foreground">We operate with transparency, honesty, and a strong sense of ethics.</p>
              </div>
              <div className="text-center">
                <Gem className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-4 font-bold text-lg">Service</h3>
                <p className="mt-1 text-muted-foreground">We are committed to giving back and serving the needs of our community.</p>
              </div>
              <div className="text-center">
                <Gem className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-4 font-bold text-lg">Growth</h3>
                <p className="mt-1 text-muted-foreground">We believe in continuous learning and sustainable development for individuals and the group.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-16 md:py-24">
        <div className="container py-12 md:py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-headline font-bold">Group Events</h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              Get involved, learn new skills, and connect with the community.
            </p>
          </div>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {upcomingEventsLoading ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)
                ) : upcomingEvents && upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                    <p className="text-muted-foreground col-span-3 text-center py-10">No upcoming events. Please check back later.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="past">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {pastEventsLoading ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)
                ) : pastEvents && pastEvents.length > 0 ? (
                  pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                    <p className="text-muted-foreground col-span-3 text-center py-10">No past events found.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto text-center">
           <h2 className="text-3xl md:text-4xl font-headline font-semibold">Ready to Make a Difference?</h2>
           <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
             Become a part of our journey. Whether you're from our village or share our vision, there's a place for you at The Empowers youth group.
           </p>
           <Button size="lg" asChild className="mt-8" style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}>
              <Link href="/register">Join The Empowers youth group Today</Link>
            </Button>
        </div>
      </section>
    </div>
  );
}

    