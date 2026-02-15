"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const handleSignIn = () => {
    signIn("keycloak", { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 bg-card border border-border/50 rounded-2xl card-glow">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Personal Finance Logo"
            width={70}
            height={70}
            className="drop-shadow-lg"
          />
        </div>
        <h1 className="text-3xl font-bold text-center mb-2 text-foreground">
          Welcome Back
        </h1>
        <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-4 rounded-full" />
        <p className="text-center text-foreground-muted mb-8 text-sm">
          Sign in to manage your finances
        </p>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-xl text-error text-sm">
            Authentication failed. Please try again.
          </div>
        )}

        <button
          onClick={handleSignIn}
          className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
        >
          Sign In
        </button>

        <p className="mt-6 text-center text-sm text-foreground-muted">
          Don't have an account?{" "}
          <button
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/registrations?client_id=${process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID}&redirect_uri=${window.location.origin}/api/auth/callback/keycloak&response_type=code`;
            }}
            className="text-primary hover:text-primary-hover transition-colors font-medium"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
