"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CardWrapper from "./card-wrapper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RegisterSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { z } from "zod";

async function handleSubmit(
  data: z.infer<typeof RegisterSchema>,
  setError: (arg0: string) => void,
  router: any,
  setLoading: (arg0: boolean) => void
) {
  setLoading(true);
  setError("");

  const { email, password, confirmPassword } = data;

  if (password !== confirmPassword) {
    setError("Passwords do not match.");
    setLoading(false);
    return;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      router.push("/sign-in");
    } else {
      const result = await response.json();
      setError(result.message || "An error occurred. Please try again.");
    }
  } catch (err) {
    setError("An error occurred. Please try again.");
  } finally {
    setLoading(false);
  }
}

const RegisterForm = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [error, setError] = useState("");

  // Vérification du token de session avant d'afficher le formulaire
  useEffect(() => {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) {
      // Rediriger l'utilisateur si le token de session est absent
      router.push("/sign-in");
    }
  }, [router]);

  const form = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <CardWrapper
      label="Crée ton compte et commence à utiliser l'application"
      title="Inscription"
      backButtonHref="sign-in"
      backButtonLabel="Already have an account? Login here."
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => handleSubmit(data, setError, router, setLoading))}
          className="space-y-6"
        >
          {error && <p className="text-red-500">{error}</p>}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={"text-black"}>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="johndoe@gmail.com" />
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
                  <FormLabel className={"text-black"}>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="******" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={"text-black"}>Confirm Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="******" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            type="submit"
            className="w-full font-semibold bg-black hover:bg-gradient-to-r from-emerald-600 to-blue-500 text-slate-300 hover:text-black"
            disabled={loading}
          >
            {loading ? "Loading..." : "Register"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};

export default RegisterForm;
