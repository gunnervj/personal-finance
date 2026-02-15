import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="flex justify-center mb-6 sm:mb-8">
          <Image
            src="/logo.png"
            alt="Personal Finance Logo"
            width={120}
            height={120}
            className="drop-shadow-2xl animate-float w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36"
            priority
          />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 text-foreground">
          Personal Finance
        </h1>
        <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full" />
        <p className="text-base sm:text-lg md:text-xl text-foreground-muted mb-8 max-w-2xl mx-auto leading-relaxed">
          Take control of your finances. Track expenses, manage budgets, and
          achieve your financial goals with ease.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
