import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
  const aboutImage = PlaceHolderImages.find((img) => img.id === 'about-story');

  return (
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
            {aboutImage && (
              <Image
                src={aboutImage.imageUrl}
                alt={aboutImage.description}
                width={600}
                height={400}
                className="w-full h-64 md:h-full object-cover rounded-t-lg md:rounded-lg"
                data-ai-hint={aboutImage.imageHint}
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
  );
}
