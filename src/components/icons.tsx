import { cn } from "@/lib/utils";

export function TheEmpowersYouthGroupLogo({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-full border-2 border-primary bg-white shadow-md flex-shrink-0", className)}>
      <img
        src="/logo.jpeg"
        alt="The Empowers Youth Group Logo"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
