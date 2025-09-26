
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { TheEmpowersYouthGroupLogo } from "@/components/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="w-full min-h-screen flex items-center justify-center py-12">
      <div className="mx-auto grid w-[350px] gap-6">
        <div className="grid gap-2 text-center">
          <Link href="/" className="flex flex-col items-center justify-center space-y-2 mb-4">
            <TheEmpowersYouthGroupLogo className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline whitespace-nowrap">The Empowers youth group</h1>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
