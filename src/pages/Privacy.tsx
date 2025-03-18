import { PageTransition } from "@/components/PageTransition";
import { ExpandableSection } from "@/components/ui/expandable-section";
import { Shield, Lock, Eye, UserCheck, Database, Bell, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const privacySections = [
  {
    icon: Database,
    title: "Data Collection",
    content: `We collect information that you provide directly to us, including:
    • Account information (name, email, phone number)
    • Profile information (profile picture, bio)
    • Listing information (photos, descriptions, prices)
    • Messages between users
    • Transaction information`
  },
  {
    icon: Eye,
    title: "How We Use Your Data",
    content: `Your data helps us:
    • Provide and improve our services
    • Personalize your experience
    • Process your transactions
    • Send you important updates
    • Maintain platform security`
  },
  {
    icon: UserCheck,
    title: "Your Rights",
    content: `You have the right to:
    • Access your personal data
    • Correct inaccurate data
    • Request data deletion
    • Export your data
    • Opt-out of marketing communications`
  },
  {
    icon: Lock,
    title: "Data Security",
    content: `We protect your data through:
    • Encryption in transit and at rest
    • Regular security audits
    • Access controls and monitoring
    • Secure data storage practices
    • Regular backups`
  },
  {
    icon: Bell,
    title: "Communication Preferences",
    content: `You can control:
    • Push notifications
    • Email notifications
    • Marketing communications
    • In-app messages
    • Update frequency`
  }
];

export default function Privacy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10">
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-full bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center">Privacy Policy</h1>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32 space-y-6">
            <div className="prose prose-invert max-w-none mb-8">
              <p className="text-gray-400">
                At Tradezy, we take your privacy seriously. This policy outlines how we collect,
                use, and protect your personal information. By using our service, you agree to
                the collection and use of information in accordance with this policy.
              </p>
            </div>

            <div className="space-y-4">
              {privacySections.map((section, index) => (
                <ExpandableSection
                  key={index}
                  icon={section.icon}
                  label={section.title}
                  iconColor="text-yellow-500"
                  bgColor="bg-yellow-500/10"
                >
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-400 whitespace-pre-line">{section.content}</p>
                  </div>
                </ExpandableSection>
              ))}
            </div>

            <div className="mt-8 text-center text-sm text-gray-400">
              <p>Last updated: March 2025</p>
              <p className="mt-2">
                If you have any questions about our Privacy Policy, please{" "}
                <a href="/help" className="text-primary hover:underline">
                  contact us
                </a>
                .
              </p>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
} 