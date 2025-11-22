import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, MessageSquare, Mail, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

export default function Feedback() {
  const navigate = useNavigate();
  const { isSidebarCollapsed } = useSettings();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast.error("Please fill out all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Log feedback details (for demonstration)
      console.log('Feedback submitted:', {
        name,
        email,
        subject: subject || 'Feedback from Campus Deal',
        message
      });
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      toast.success("Feedback sent successfully! Thank you for your input.");
      
      // Reset the form
      setName("");
      setEmail("");
      setMessage("");
      setSubject("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to send feedback. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      {/* Header */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 transition-all duration-300",
        isSidebarCollapsed ? "ml-0 lg:ml-[80px]" : "ml-0 lg:ml-[240px]"
      )}>
        <div className="relative px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-full bg-pink-500/10 text-pink-500 hover:bg-pink-500/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center">Feedback</h1>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-2xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32 space-y-6">
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center p-4 rounded-full ${theme === 'light' ? 'bg-pink-100' : 'bg-pink-500/10'} mb-4`}>
                  <MessageCircle className="h-8 w-8 text-pink-500" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">We Value Your Feedback</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Your feedback helps us improve Campus Deal. Let us know your thoughts, suggestions, or report any issues.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 bg-card/50 dark:bg-card/5 rounded-xl p-6 border border-border/40 dark:border-white/10">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-foreground">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-background border border-pink-200/50 hover:border-pink-300/50 focus-visible:ring-pink-500/20 focus-visible:ring-offset-0 transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-background border border-pink-200/50 hover:border-pink-300/50 focus-visible:ring-pink-500/20 focus-visible:ring-offset-0 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-foreground">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-background border border-pink-200/50 hover:border-pink-300/50 focus-visible:ring-pink-500/20 focus-visible:ring-offset-0 transition-colors"
                      placeholder="Briefly describe your feedback"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-foreground">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please provide as much detail as possible..."
                      rows={5}
                      className="w-full bg-background border border-pink-200/50 hover:border-pink-300/50 focus-visible:ring-pink-500/20 focus-visible:ring-offset-0 transition-colors"
                      required
                    />
                  </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      We'll respond within 24-48 hours
                    </p>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full sm:w-auto gap-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border border-pink-300/50 hover:border-pink-400/50 backdrop-blur-sm"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {isSubmitting ? 'Sending...' : 'Send Feedback'}
                    </Button>
                  </div>
              </form>

              <div className="text-center text-sm text-muted-foreground pt-6 mt-4">
                <p>Need immediate help? <a href="mailto:support@campusdeal.ng" className="text-pink-500 hover:underline">Contact our support team</a></p>
              </div>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
