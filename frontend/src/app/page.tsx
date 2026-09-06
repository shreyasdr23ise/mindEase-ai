import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AiSupportSection } from "@/components/landing/ai-support-section";
import { PrivacySection } from "@/components/landing/privacy-section";
import { CrisisSection } from "@/components/landing/crisis-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AiSupportSection />
        <HowItWorks />
        <PrivacySection />
        <CrisisSection />
      </main>
      <Footer />
    </div>
  );
}