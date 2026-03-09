import { TheEmpowersYouthGroupLogo } from "@/components/icons";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-8 md:py-0">
      <div className="container grid grid-cols-1 md:grid-cols-3 items-center gap-6 md:h-32">
        {/* Left Section: Logo and Tagline */}
        <div className="flex items-center gap-4 justify-center md:justify-start">
          <TheEmpowersYouthGroupLogo className="h-16 w-16" />
          <p className="text-sm font-medium text-muted-foreground italic max-w-[150px] leading-tight">
            Built for a brighter future
          </p>
        </div>

        {/* Center Section: Copyright */}
        <div className="text-center order-last md:order-none">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} <span className="font-semibold text-foreground">The Empowers Youth Group</span>.
          </p>
        </div>

        {/* Right Section: Spacer for alignment */}
        <div className="hidden md:block"></div>
      </div>
    </footer>
  );
}
