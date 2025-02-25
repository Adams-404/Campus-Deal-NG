
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart2, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageTransition>
          {/* Hero Section */}
          <section className="py-20 text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Welcome to TradeX
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Your secure platform for trading within the GSU community. Buy, sell, and exchange with confidence.
            </p>
            <Link to="/auth">
              <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-full">
                Get Started <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </section>

          {/* Features Section */}
          <section className="py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-secondary/50 p-6 rounded-xl border border-white/10">
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Trading</h3>
              <p className="text-gray-400">
                Verified users and KYC process ensures safe transactions within our community.
              </p>
            </div>

            <div className="bg-secondary/50 p-6 rounded-xl border border-white/10">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Student Community</h3>
              <p className="text-gray-400">
                Connect with fellow GSU students and trade with trust.
              </p>
            </div>

            <div className="bg-secondary/50 p-6 rounded-xl border border-white/10">
              <BarChart2 className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Market Insights</h3>
              <p className="text-gray-400">
                Stay updated with trending items and best deals on campus.
              </p>
            </div>
          </section>
        </PageTransition>
      </main>
    </div>
  );
};

export default Index;
