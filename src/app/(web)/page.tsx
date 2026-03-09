'use client'

import Image from "next/image";
import Link from "next/link";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Calendar, Target, Eye, Gem } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import type { Event } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
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
    <div className="flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[75vh] w-full overflow-hidden">
        <Image
          src="/empower4.jpg?v=2"
          alt="Youth group collaborating on a project"
          fill
          className="object-cover"
          data-ai-hint="empowered youth"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
            <div className="container mx-auto flex flex-col items-center justify-center">
                <h1 className="text-4xl md:text-7xl font-headline font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    Empowering Youth,<br />Building Community
                </h1>
                <p className="mt-6 max-w-2xl text-base md:text-xl text-white/90 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                    From shared hardship to a beacon of hope, The Empowers youth group is a youth-led initiative dedicated to giving back and uplifting our society.
                </p>
                <div className="mt-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                    <Button size="lg" asChild className="h-14 px-8 text-lg rounded-full bg-accent text-accent-foreground hover:bg-accent/90 border-none">
                        <Link href="/register">Join Our Movement</Link>
                    </Button>
                </div>
            </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-primary">What We Do</h2>
            <div className="w-24 h-1 bg-accent mx-auto mt-4 rounded-full" />
            <p className="mt-6 max-w-2xl mx-auto text-muted-foreground text-lg">
              We focus on three core pillars to create sustainable growth and opportunity within our community.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <Card className="text-center border-none shadow-md hover:shadow-xl transition-shadow bg-card h-full">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-6 rounded-full w-fit">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl mt-4">Community Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">Engaging in impactful projects that address local needs and foster a spirit of togetherness.</p>
              </CardContent>
            </Card>
            <Card className="text-center border-none shadow-md hover:shadow-xl transition-shadow bg-card h-full">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-6 rounded-full w-fit">
                  <TrendingUp className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl mt-4">Shared Investments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">Pooling resources to invest in sustainable ventures that generate returns for the group and fund our mission.</p>
              </CardContent>
            </Card>
            <Card className="text-center border-none shadow-md hover:shadow-xl transition-shadow bg-card h-full">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-6 rounded-full w-fit">
                  <Calendar className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl mt-4">Events & Workshops</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">Organizing events that promote learning, collaboration, and personal development for all members.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-28 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full lg:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-5xl font-headline font-bold text-primary">About Us</h2>
              <div className="w-20 h-1 bg-accent rounded-full" />
              <h3 className="text-2xl font-headline font-semibold text-foreground italic">"From Hardship to Hope"</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                The Empowers youth group began not as an organization, but as a conversation among friends. We were a group of youths from the same village, each having navigated the challenges of limited opportunities and economic hardship.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Having found our own paths to stability, we felt a collective responsibility to return to our roots and build the support system we wished we'd had. We decided to pool our resources, knowledge, and energy to create a platform for the next generation.
              </p>
              <div className="pt-4">
                <Button variant="outline" asChild className="rounded-full border-primary text-primary hover:bg-primary hover:text-white">
                  <Link href="/register">Learn More About Joining</Link>
                </Button>
              </div>
            </div>
            <div className="w-full lg:w-1/2 relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                    src="/youth5.jpg?v=2"
                    alt="A smiling young person"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-500"
                    data-ai-hint="youth empowerment"
                />
              </div>
              <div className="absolute -top-6 -right-6 w-full h-full border-4 border-accent/20 rounded-2xl -z-0" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section id="mission" className="bg-primary text-primary-foreground py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
            <div className="space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="bg-white/10 p-4 rounded-full w-fit">
                <Target className="w-12 h-12 text-accent" />
              </div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold">Our Mission</h2>
              <p className="text-xl text-primary-foreground/80 leading-relaxed">
                To empower the youth of our community by fostering economic independence, social responsibility, and personal growth through collaborative projects and shared investments.
              </p>
            </div>
            <div className="space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="bg-white/10 p-4 rounded-full w-fit">
                <Eye className="w-12 h-12 text-accent" />
              </div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold">Our Vision</h2>
              <p className="text-xl text-primary-foreground/80 leading-relaxed">
                We envision a thriving, self-reliant community where every young person has the tools, support, and opportunity to achieve their full potential.
              </p>
            </div>
          </div>
          
          <div className="mt-24 pt-20 border-t border-white/10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Our Core Values</h2>
              <p className="max-w-2xl mx-auto text-primary-foreground/70">The principles that guide every decision we make and action we take.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {[
                { icon: Gem, title: "Unity", desc: "We are stronger together. Collaboration is at our heart." },
                { icon: Gem, title: "Integrity", desc: "We operate with transparency, honesty, and strong ethics." },
                { icon: Gem, title: "Service", desc: "We are committed to giving back and serving our community." },
                { icon: Gem, title: "Growth", desc: "We believe in continuous learning and sustainable development." }
              ].map((value, idx) => (
                <div key={idx} className="text-center bg-white/5 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                  <value.icon className="mx-auto h-10 w-10 text-accent" />
                  <h3 className="mt-6 font-bold text-xl uppercase tracking-wider">{value.title}</h3>
                  <p className="mt-3 text-primary-foreground/60 leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-primary">Group Events</h2>
            <div className="w-24 h-1 bg-accent mx-auto mt-4 rounded-full" />
            <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed">
              Get involved, learn new skills, and connect with the community through our scheduled activities.
            </p>
          </div>
          
          <Tabs defaultValue="upcoming" className="w-full">
            <div className="flex justify-center mb-10">
              <TabsList className="bg-muted p-1 h-14 rounded-full">
                <TabsTrigger value="upcoming" className="px-8 rounded-full h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-lg">Upcoming</TabsTrigger>
                <TabsTrigger value="past" className="px-8 rounded-full h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-lg">Past Events</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="upcoming" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {upcomingEventsLoading ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-[450px] w-full rounded-2xl" />)
                ) : upcomingEvents && upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
                      <p className="text-muted-foreground text-lg">No upcoming events at the moment. Stay tuned!</p>
                    </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="past" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {pastEventsLoading ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-[450px] w-full rounded-2xl" />)
                ) : pastEvents && pastEvents.length > 0 ? (
                  pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
                      <p className="text-muted-foreground text-lg">Our history is just beginning. No past events found.</p>
                    </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section className="py-24 bg-accent/5 overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="bg-primary rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-headline font-bold text-white leading-tight">Ready to Make a Real Difference?</h2>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed">
                Become a part of our journey. Whether you're from our village or share our vision from afar, there's a vital place for you at The Empowers youth group.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild className="h-16 px-10 text-xl rounded-full bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto border-none">
                  <Link href="/register">Join Us Today</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-16 px-10 text-xl rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground w-full sm:w-auto">
                  <Link href="#about">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
