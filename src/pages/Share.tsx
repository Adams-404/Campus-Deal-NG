import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  ArrowLeft,
  Copy,
  Facebook,
  Twitter,
  Mail,
  MessageCircle,
  QrCode,
  Linkedin,
  Instagram
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";

const shareOptions = [
  {
    icon: Copy,
    label: "Copy Link",
    action: async () => {
      await navigator.clipboard.writeText("https://tradezy.com");
      toast.success("Link copied to clipboard!");
    },
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    hoverBgColor: "hover:bg-blue-500/20"
  },
  {
    icon: Facebook,
    label: "Facebook",
    action: () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://tradezy.com")}`, "_blank");
    },
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10",
    hoverBgColor: "hover:bg-[#1877F2]/20"
  },
  {
    icon: Twitter,
    label: "Twitter",
    action: () => {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent("https://tradezy.com")}&text=${encodeURIComponent("Check out Tradezy - Buy and sell within your university community!")}`, "_blank");
    },
    color: "text-[#1DA1F2]",
    bgColor: "bg-[#1DA1F2]/10",
    hoverBgColor: "hover:bg-[#1DA1F2]/20"
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    action: () => {
      window.open(`https://wa.me/?text=${encodeURIComponent("Check out Tradezy: https://tradezy.com")}`, "_blank");
    },
    color: "text-[#25D366]",
    bgColor: "bg-[#25D366]/10",
    hoverBgColor: "hover:bg-[#25D366]/20"
  },
  {
    icon: Instagram,
    label: "Instagram",
    action: () => {
      navigator.clipboard.writeText("https://tradezy.com");
      toast.info("Link copied! Share it on your Instagram story or post");
    },
    color: "text-[#E4405F]",
    bgColor: "bg-[#E4405F]/10",
    hoverBgColor: "hover:bg-[#E4405F]/20"
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    action: () => {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://tradezy.com")}`, "_blank");
    },
    color: "text-[#0A66C2]",
    bgColor: "bg-[#0A66C2]/10",
    hoverBgColor: "hover:bg-[#0A66C2]/20"
  },
  {
    icon: MessageCircle,
    label: "Telegram",
    action: () => {
      window.open(`https://t.me/share/url?url=${encodeURIComponent("https://tradezy.com")}&text=${encodeURIComponent("Check out Tradezy - Buy and sell within your university community!")}`, "_blank");
    },
    color: "text-[#0088CC]",
    bgColor: "bg-[#0088CC]/10",
    hoverBgColor: "hover:bg-[#0088CC]/20"
  },
  {
    icon: Mail,
    label: "Email",
    action: () => {
      window.location.href = `mailto:?subject=${encodeURIComponent("Check out Tradezy!")}&body=${encodeURIComponent("I found this great marketplace for university students: https://tradezy.com")}`;
    },
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    hoverBgColor: "hover:bg-pink-500/20"
  },
  {
    icon: MessageCircle,
    label: "Messages",
    action: () => {
      window.location.href = `sms:?&body=${encodeURIComponent("Check out Tradezy: https://tradezy.com")}`;
    },
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    hoverBgColor: "hover:bg-green-500/20"
  },
  {
    icon: QrCode,
    label: "QR Code",
    action: () => {
      toast.info("QR Code feature coming soon!");
    },
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    hoverBgColor: "hover:bg-purple-500/20"
  }
];

export default function Share() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 text-foreground pb-24">
      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <PageTransition>
          {/* Fixed Header */}
          <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm z-50 border-b border-border/60">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
              <div className="h-16 flex items-center justify-between gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="h-9 w-9 rounded-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold flex-1 text-center">Share Tradezy</h1>
                <div className="w-9" /> {/* Spacer for centering */}
              </div>
            </div>
          </div>

          <section className="pt-24 pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {shareOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={option.action}
                  className={`p-6 rounded-lg border border-white/10 flex flex-col items-center gap-3 transition-colors ${option.bgColor} ${option.hoverBgColor}`}
                >
                  <option.icon className={`w-8 h-8 ${option.color}`} />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Share Tradezy with your friends and help grow our university community!
              </p>
            </div>
          </section>
        </PageTransition>
      </main>
    </div>
  );
} 