import Link from "next/link";
import { TheEmpowersYouthGroupLogo } from "@/components/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="w-full min-h-screen flex items-center justify-center py-12 px-4 bg-muted/10">
      <div className="mx-auto grid w-full max-w-sm gap-8 sm:w-[400px]">
        <div className="grid gap-4 text-center">
          <Link href="/" className="flex flex-col items-center justify-center space-y-4">
            <TheEmpowersYouthGroupLogo className="h-24 w-24" />
            <div className="space-y-1">
              <h1 className="text-3xl font-bold font-headline text-primary">The Empowers</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Youth Group</p>
            </div>
          </Link>
        </div>
        <div className="bg-card p-8 rounded-xl border shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
