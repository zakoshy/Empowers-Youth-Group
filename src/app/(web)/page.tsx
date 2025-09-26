import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, TrendingUp, Calendar } from "lucide-react";

export default function HomePage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === "hero");
  const communityImage = PlaceHolderImages.find((img) => img.id === "community-card");
  const investmentImage = PlaceHolderImages.find((img) => img.id === "investment-card");
  const eventsImage = PlaceHolderImages.find((img) => img.id === "events-card");
  const aboutImage = PlaceHolderImages.find((img) => img.id === "about-story");

  return (
    <div className="flex flex-col">
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
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

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
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
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

      <section className="py-16 md:py-24">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl md:text-4xl font-headline font-semibold">Our Story of Resilience</h2>
            <p className="mt-4 text-muted-foreground">
              The Empowers youth group was born from the shared experiences of youths from our village who faced and overcame significant hardships. We believe in the power of unity and collective action to create a better future. Our journey from adversity to advocacy fuels our passion to give back and ensure that every young person in our community has the opportunity to thrive.
            </p>
            <Button asChild className="mt-6">
              <Link href="/about">
                Read Our Full Story <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="order-1 md:order-2">
            {aboutImage && (
              <Image
                src={aboutImage.imageUrl}
                alt={aboutImage.description}
                width={600}
                height={400}
                className="rounded-lg shadow-lg object-cover"
                data-ai-hint={aboutImage.imageHint}
              />
            )}
          </div>
        </div>
      </section>
      
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
