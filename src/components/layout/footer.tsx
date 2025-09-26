import { EmpowerHubLogo } from "@/components/icons";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-center gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <EmpowerHubLogo className="h-6 w-6 text-primary" />
          <p className="text-center text-sm leading-loose">
            Built for a brighter future. © {new Date().getFullYear()} The Empowers youth group.
          </p>
        </div>
      </div>
    </footer>
  );
}
