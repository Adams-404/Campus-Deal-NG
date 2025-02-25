import { PageTransition } from "@/components/PageTransition";
import { ExpandableSection } from "@/components/ui/expandable-section";
import { HelpCircle, Mail, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const faqs = [
  {
    question: "How do I list an item for sale?",
    answer: "To list an item, tap the '+' button in the bottom navigation bar. Fill in the item details including photos, title, price, and description. Make sure to select the appropriate category and condition before listing."
  },
  {
    question: "How do I message a seller?",
    answer: "Click on any item you're interested in, then tap the 'Message Seller' button. You can discuss details, arrange meetups, and negotiate prices through our messaging system."
  },
  {
    question: "Is my payment secure?",
    answer: "We recommend using secure payment methods and meeting in safe, public locations for transactions. Never share your payment details through messages."
  },
  {
    question: "How do I report an issue?",
    answer: "If you encounter any problems, tap the 'Report' button on the item or user profile. Our team will review your report and take appropriate action within 24 hours."
  },
  {
    question: "Can I edit my listing after posting?",
    answer: "Yes, you can edit your listing anytime. Go to your profile, find the listing under 'My Items', and tap the 'Edit' button to make changes."
  }
];

export default function Help() {
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
              className="h-9 w-9 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center">Help Center</h1>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32 space-y-6">
            {/* Quick Support */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Button
                variant="outline"
                className="h-auto p-4 flex items-center gap-3 border-green-500/20 hover:bg-green-500/10"
              >
                <Mail className="w-5 h-5 text-green-500" />
                <div className="text-left">
                  <div className="font-medium">Email Support</div>
                  <div className="text-sm text-muted-foreground">support@gsumarket.com</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex items-center gap-3 border-green-500/20 hover:bg-green-500/10"
              >
                <MessageSquare className="w-5 h-5 text-green-500" />
                <div className="text-left">
                  <div className="font-medium">Live Chat</div>
                  <div className="text-sm text-muted-foreground">Available 9 AM - 5 PM</div>
                </div>
              </Button>
            </div>

            {/* FAQs */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
              {faqs.map((faq, index) => (
                <ExpandableSection
                  key={index}
                  icon={HelpCircle}
                  label={faq.question}
                  iconColor="text-green-500"
                  bgColor="bg-green-500/10"
                >
                  <p className="text-gray-400">{faq.answer}</p>
                </ExpandableSection>
              ))}
            </div>

            {/* Still Need Help */}
            <div className="mt-12 text-center">
              <h3 className="text-lg font-semibold mb-2">Still Need Help?</h3>
              <p className="text-gray-400 mb-4">
                Our support team is here to assist you with any questions or concerns.
              </p>
              <Button>Contact Support</Button>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
} 