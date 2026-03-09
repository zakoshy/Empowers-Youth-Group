import { TheEmpowersYouthGroupLogo } from "@/components/icons";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container flex flex-col items-center justify-between gap-6 py-12 md:flex-row md:h-28 md:py-0">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <TheEmpowersYouthGroupLogo className="h-16 w-16" />
          <div className="text-center md:text-left">
            <p className="font-headline font-bold text-lg text-primary leading-tight">The Empowers youth group</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Empowering Youth, Building Community</p>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Built for a brighter future. &copy; {new Date().getFullYear()} The Empowers youth group.
        </p>
      </div>
    </footer>
  );
}
