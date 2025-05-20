import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Headset } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Feedback() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        subject: subject || 'Feedback from GSU Market',
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 ml-0 lg:ml-[300px] transition-all duration-300">
        <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="w-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="text-primary lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <h1 className="text-lg font-semibold absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">Feedback</h1>
            <div className="w-10 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/support')}
                className="text-[#1078a7] hover:text-[#1078a7]/80 bg-white/90 dark:bg-transparent shadow-sm"
              >
                <Headset className="h-6 w-6" />
              </Button>
            </div>
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-300">
        <PageTransition>
          <div className="pt-24 pb-32 space-y-8 mx-auto max-w-3xl">
            <div className="lg:bg-background/5 lg:rounded-xl lg:p-6 lg:border lg:border-white/10 lg:shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">We Value Your Feedback</h2>
                <p className="text-muted-foreground">
                  Your feedback helps us improve GSU Market. Please let us know your thoughts, suggestions, or report any issues.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">Name <span className="text-red-500">*</span></label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border-2 border-[#1078a7] bg-white/90 dark:bg-black focus:ring-2 focus:ring-[#1078a7]/50 shadow-sm"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-2 border-[#1078a7] bg-white/90 dark:bg-black focus:ring-2 focus:ring-[#1078a7]/50 shadow-sm"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full border-2 border-[#1078a7] bg-white/90 dark:bg-black focus:ring-2 focus:ring-[#1078a7]/50 shadow-sm"
                      placeholder="What's this about?"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">Message <span className="text-red-500">*</span></label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full min-h-[150px] border-2 border-[#1078a7] bg-white/90 dark:bg-black focus:ring-2 focus:ring-[#1078a7]/50 shadow-sm"
                      placeholder="Tell us your thoughts, suggestions, or report any issues..."
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-[#1078a7] hover:bg-[#1078a7]/90 text-white border-2 border-[#1078a7] shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-[#1078a7] shadow-sm">
                <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                <p className="text-sm text-muted-foreground">You can also reach us directly at:</p>
                <a 
                  href="mailto:help.gsumarket@gmail.com" 
                  className="text-[#1078a7] font-medium hover:underline block mt-1"
                >
                  help.gsumarket@gmail.com
                </a>
              </div>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
