import { RegisterForm } from "@/components/auth/register-form";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function RegisterFormSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-full mx-auto" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFormSkeleton />}>
        <RegisterForm />
    </Suspense>
  );
}
