import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Eye, Gem } from 'lucide-react';

export default function MissionVisionPage() {
  const pageImage = PlaceHolderImages.find((img) => img.id === 'mission-vision');

  return (
    <div>
      <section className="relative h-[40vh] w-full">
        {pageImage && (
          <Image
            src={pageImage.imageUrl}
            alt={pageImage.description}
            fill
            className="object-cover"
            data-ai-hint={pageImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-primary/60" />
        <div className="relative container mx-auto h-full flex flex-col items-center justify-center text-center text-primary-foreground">
          <h1 className="text-4xl md:text-6xl font-headline font-bold">
            Our Purpose
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl">
            Driving positive change through a clear mission and a shared vision for the future.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
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
      </section>

      <section className="py-16 md:py-24 bg-card">
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
      </section>
    </div>
  );
}
