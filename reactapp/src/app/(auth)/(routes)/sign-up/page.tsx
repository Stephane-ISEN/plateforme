"use client";

import RegisterForm from "@/components/auth/register-form";
import TokenVerifier from "@/components/auth/token-verifier";
import { Suspense } from "react";

const RegisterPage = () => {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <TokenVerifier>
        <RegisterForm />
      </TokenVerifier>
    </Suspense>
  );
};

export default RegisterPage;