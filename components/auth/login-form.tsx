"use client";

import CardWrapper from "./card-wrapper";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoginSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";


 async function handleSubmit(data: z.infer<typeof LoginSchema>, setError: (arg0: string) => void, router: any, setLoading: (arg0: boolean) => void) {
  setLoading(true);
  setError("");

  const { email, password } = data;

  const params = new URLSearchParams();
  params.append("username", email);
  params.append("password", password);

  try {

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/login/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (response.ok) {
      const result = await response.json();
      localStorage.setItem('token', result.access_token);
      localStorage.setItem('token_type', result.token_type);
      router.push("/dashboard");
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

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [error, setError] = useState("");

  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <CardWrapper
      label="Connecte-toi à ton compte"
      title="Connexion"
      backButtonHref="sign-up"
      backButtonLabel="Don't have an account? Register here."
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => handleSubmit(data, setError, router, setLoading))}
          className="space-y-6"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black font-semibold">Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="johndoe@gmail.com" className="text-black-input" />
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
                  <FormLabel className="text-black font-semibold">Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="******" className="text-black-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" className="w-full font-semibold bg-black hover:bg-gradient-to-r from-emerald-600 to-blue-500 text-slate-300 hover:text-black" disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};

export default LoginForm;
