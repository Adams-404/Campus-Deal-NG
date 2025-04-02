
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  MessageSquare, 
  Mail, 
  Phone, 
  Send,
  HelpCircle,
  FileQuestion,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export default function Support() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fake list of FAQs
  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "You can reset your password by clicking on 'Forgot Password' on the sign-in page. Follow the instructions sent to your email to create a new password."
    },
    {
      question: "How can I contact a seller?",
      answer: "You can contact a seller by viewing their item and clicking the 'Message Seller' button. This will start a conversation with them in your messages."
    },
    {
      question: "Is my personal information secure?",
      answer: "We take data security seriously. Your personal information is encrypted and we never share your data with third parties without your consent."
    },
    {
      question: "How do I report a suspicious listing?",
      answer: "You can report a suspicious listing by clicking the 'Report' button on the item page. Our admin team will review it as soon as possible."
    },
    {
      question: "Can I sell items without creating an account?",
      answer: "No, you need to create an account to sell items. This helps maintain security and accountability on our platform."
    }
  ];

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Get user info
      const { data: { user } } = await supabase.auth.getUser();
      
      // Simulate sending a support request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Your message has been sent to our support team. We'll get back to you soon.");
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !subject.trim() || !message.trim() || !name.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate sending a support request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Your email has been sent to our support team. We'll get back to you soon.");
      setEmail("");
      setSubject("");
      setMessage("");
      setName("");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !name.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate scheduling a call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Your call request has been scheduled. Our team will call you at the specified number.");
      setPhone("");
      setName("");
    } catch (error) {
      console.error("Error scheduling call:", error);
      toast.error("Failed to schedule call. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-semibold">Support</h1>
            </div>
            <div className="w-9"></div> {/* Empty div for centering */}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32">
            <div className="mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-8">
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat</span>
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="space-y-6">
                  <div className="bg-secondary p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Chat Support
                    </h2>
                    <p className="text-gray-400 mb-6">
                      Our support team is online and ready to help. Send us a message and we'll respond as soon as possible.
                    </p>
                    <form onSubmit={handleChatSubmit} className="space-y-4">
                      <Textarea
                        placeholder="Describe your issue or question..."
                        className="min-h-[120px]"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Sending...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            <span>Send Message</span>
                          </div>
                        )}
                      </Button>
                    </form>
                  </div>

                  <div className="bg-secondary p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                      {faqs.map((faq, index) => (
                        <div key={index} className="border-b border-white/10 pb-4 last:border-0">
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <FileQuestion className="h-4 w-4 text-primary" />
                            {faq.question}
                          </h3>
                          <p className="text-gray-400">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-6">
                  <div className="bg-secondary p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Email Support
                    </h2>
                    <p className="text-gray-400 mb-6">
                      Send us an email and our support team will get back to you within 24 hours.
                    </p>
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input
                            id="name"
                            placeholder="Your name"
                            className="pl-10"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Your email address"
                            className="pl-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
                        <Input
                          id="subject"
                          placeholder="Subject of your inquiry"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
                        <Textarea
                          id="message"
                          placeholder="Describe your issue or question..."
                          className="min-h-[120px]"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Sending...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            <span>Send Email</span>
                          </div>
                        )}
                      </Button>
                    </form>
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="space-y-6">
                  <div className="bg-secondary p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      Phone Support
                    </h2>
                    <p className="text-gray-400 mb-6">
                      Request a call back from our support team. We'll call you at a time that works for you.
                    </p>
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="phone-name" className="block text-sm font-medium mb-1">Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input
                            id="phone-name"
                            placeholder="Your name"
                            className="pl-10"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="Your phone number"
                            className="pl-10"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Scheduling...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>Request Call Back</span>
                          </div>
                        )}
                      </Button>
                    </form>
                  </div>

                  <div className="bg-secondary p-6 rounded-lg border border-white/10">
                    <h2 className="text-xl font-semibold mb-4">Direct Contact</h2>
                    <p className="text-gray-400 mb-4">
                      Alternatively, you can call our support hotline directly:
                    </p>
                    <div className="flex items-center justify-center gap-4 p-4 border border-white/10 rounded-lg bg-black/20">
                      <Phone className="h-6 w-6 text-primary" />
                      <a href="tel:+1234567890" className="text-xl font-semibold text-primary">
                        +1 (234) 567-890
                      </a>
                    </div>
                    <p className="text-sm text-gray-400 mt-4 text-center">
                      Available Monday - Friday, 9:00 AM - 5:00 PM EST
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
