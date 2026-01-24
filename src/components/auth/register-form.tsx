"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Eye, EyeOff, Loader2, CreditCard, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export function RegisterForm() {
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get('payment_success') === 'true';

  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${values.firstName} ${values.lastName}`
      });
      
      const isAdmin = values.email.toLowerCase() === "edwinoshome37@gmail.com";
      const userRole = isAdmin ? "Admin" : "Member";

      const userProfile = {
        id: user.uid,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        role: userRole,
        photoURL: null,
      };

      const userDocRef = doc(firestore, "userProfiles", user.uid);
      await setDoc(userDocRef, userProfile);

      if (isAdmin) {
        const adminRoleRef = doc(firestore, "roles_admin", user.uid);
        await setDoc(adminRoleRef, { email: values.email, role: 'Admin' });
      }

      toast({
        title: "Registration Successful",
        description: "Please log in with your new account.",
      });

      router.push('/login');

    } catch (error: any) {
      console.error("Registration Error: ", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    }
  }
  
  if (!paymentSuccess) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-2 text-center">
          <h1 className="text-3xl font-bold">Step 1: Registration Fee</h1>
          <p className="text-balance text-muted-foreground">
            A one-time registration fee of <span className="font-bold text-primary">Ksh 500</span> is required to join The Empowers youth group.
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-card text-center space-y-3">
          <p className="text-sm">
            Click the button below to pay via M-Pesa. After a successful payment, you will be redirected back to complete your registration.
          </p>
          <Button asChild className="w-full">
              <a href="https://lipana.dev/pay/registration-fee-3a29-1" target="_blank" rel="noopener noreferrer">
                  <CreditCard className="mr-2 h-4 w-4" /> Pay Ksh 500 Now
              </a>
          </Button>
        </div>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
      </div>
    );
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2 text-center">
          <h1 className="text-3xl font-bold">Step 2: Create an account</h1>
          <p className="text-balance text-muted-foreground text-green-600">
            Payment successful! Please complete your registration.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                    <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                    <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="m@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="0712345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showPassword ? "text" : "password"} {...field} />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {form.formState.isSubmitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
       <div className="mt-4 text-center text-sm">
         <Link href="/register" className="underline flex items-center justify-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to payment step
         </Link>
      </div>
    </Form>
  );
}
