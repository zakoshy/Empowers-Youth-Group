import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { EmpowerHubLogo } from "@/components/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authBgImage = PlaceHolderImages.find((p) => p.id === "auth-background");

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
              <EmpowerHubLogo className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold font-headline">The Empowers youth group</h1>
            </Link>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {authBgImage && (
          <Image
            src={authBgImage.imageUrl}
            alt={authBgImage.description}
            data-ai-hint={authBgImage.imageHint}
            fill
            className="object-cover dark:brightness-[0.2] dark:grayscale"
          />
        )}
      </div>
    </div>
  );
}
