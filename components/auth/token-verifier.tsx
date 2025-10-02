"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const TokenVerifier = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = searchParams.get("session_token");

      if (token) {
        // Stocker le token dans le localStorage
        localStorage.setItem("session_token", token);
      } else {
        router.push("/sign-in");
      }
    }
  }, [router, searchParams]);

  return <>{children}</>;
};

export default TokenVerifier;