import { LandingHeader } from "@/components/landing/landing-header";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Products } from "@/components/landing/products";
import { SecuritySection } from "@/components/landing/security";
import { CtaSection } from "@/components/landing/testimonials";
import { LandingFooter } from "@/components/landing/footer";
import { MobileAuthBar } from "@/components/landing/mobile-auth-bar";

export function LandingPage() {
  return (
    <div
      className="relative min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
      style={{ "--brand": "#0ea5e9" } as React.CSSProperties}
    >
      <LandingHeader />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Products />
      <SecuritySection />
      <CtaSection />
      <LandingFooter />
      <MobileAuthBar />
    </div>
  );
}