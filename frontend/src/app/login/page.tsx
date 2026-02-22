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

  const handleRegister = () => {
    // Use signIn so NextAuth generates the state cookie before redirecting.
    // prompt=create tells Keycloak to show the registration form (supported in Keycloak 24+).
    signIn("keycloak", { callbackUrl }, { prompt: "create" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 bg-card border border-border/50 rounded-2xl card-glow">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Personal Finance Logo"
            width={90}
            height={90}
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
            onClick={handleRegister}
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
