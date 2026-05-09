
import { TheEmpowersYouthGroupLogo } from "@/components/icons";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left Section: Logo and Tagline */}
          <div className="flex items-center gap-4">
            <TheEmpowersYouthGroupLogo className="h-16 w-16" />
            <div className="flex flex-col">
              <span className="font-bold text-lg text-primary font-headline">The Empowers</span>
              <p className="text-sm font-medium text-muted-foreground italic leading-tight">
                Built for a brighter future
              </p>
            </div>
          </div>

          {/* Center Section: Copyright */}
          <div className="text-center order-last md:order-none">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} <span className="font-semibold text-foreground">The Empowers Youth Group</span>. All rights reserved.
            </p>
          </div>

          {/* Right Section: Hidden on mobile, spacer for alignment on desktop */}
          <div className="hidden md:block w-16"></div>
        </div>
      </div>
    </footer>
  );
}
