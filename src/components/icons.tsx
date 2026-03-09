import Image from "next/image";

export function TheEmpowersYouthGroupLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="The Empowers Youth Group Logo"
      width={120}
      height={120}
      className={className}
      style={{ objectFit: 'contain' }}
      priority
    />
  );
}
