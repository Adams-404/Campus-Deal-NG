
import { useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";

// Import landing page components
import { HeroSection } from "@/components/landing/HeroSection";
import { AppMockupSection } from "@/components/landing/AppMockupSection";
import { AnimatedIconGrid } from "@/components/landing/AnimatedIconGrid";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { FeaturesShowcase } from "@/components/landing/FeaturesShowcase";
import { AppFeaturesList } from "@/components/landing/AppFeaturesList";

const Index = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-foreground">
        <HeroSection />
        <AppMockupSection />
        <section className="py-16 bg-black relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Everything You <span className="bg-green-500 px-6 py-2 rounded-[15px] inline-block my-2">Need</span>
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                Powerful tools to help you buy, sell and connect with other students
              </p>
            </div>
            <AnimatedIconGrid />
          </div>
        </section>
        <FeaturesShowcase />
        <AppFeaturesList />
        <FeaturesSection />
        <StatsSection />
        <TestimonialsSection />
        <CtaSection />
        <FooterSection />
      </div>
    </PageTransition>
  );
};

export default Index;
