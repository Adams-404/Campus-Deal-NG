
import React, { useState } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, Phone, Mail, MessageCircle, User, HelpCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Support() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonIssues = [
    { 
      id: 'account', 
      title: 'Account Issues', 
      description: 'Problems with login, registration, or account settings',
      icon: User
    },
    { 
      id: 'payment', 
      title: 'Payment Problems', 
      description: 'Questions about payments, refunds, or billing',
      icon: AlertCircle
    },
    { 
      id: 'listing', 
      title: 'Listing Questions', 
      description: 'Help with creating or managing your listings',
      icon: HelpCircle
    },
    { 
      id: 'safety', 
      title: 'Safety Concerns', 
      description: 'Report suspicious users or unsafe listings',
      icon: ShieldCheck
    }
  ];

  const handleSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      toast.success('Support request sent successfully! We\'ll respond within 24 hours.');
      setMessage('');
      setIsSubmitting(false);
    }, 1500);
  };

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      toast.success('Email request sent successfully! We\'ll respond within 24 hours.');
      setEmail('');
      setSubject('');
      setMessage('');
      setIsSubmitting(false);
    }, 1500);
  };

  const handleSubmitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      toast.success('Call request received! Our team will call you back shortly.');
      setName('');
      setPhone('');
      setSubject('');
      setIsSubmitting(false);
    }, 1500);
  };

  const handleCommonIssueClick = (issueId: string) => {
    setSubject(`Help with ${issueId} issue`);
    setActiveTab('chat');
    setMessage(`I need help with a ${issueId} issue. `);
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Customer Support</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Common Issues</CardTitle>
                <CardDescription>
                  Select an issue to get targeted help
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {commonIssues.map((issue) => (
                    <Button
                      key={issue.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleCommonIssueClick(issue.id)}
                    >
                      <issue.icon className="mr-2 h-4 w-4" />
                      {issue.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>support@gsumarkethub.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>+1 (888) GSU-HELP</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Our support team is available Monday through Friday, 9AM to 5PM EST.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>Choose your preferred contact method</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="chat">
                      <MessageCircle className="h-4 w-4 mr-2" /> Chat
                    </TabsTrigger>
                    <TabsTrigger value="email">
                      <Mail className="h-4 w-4 mr-2" /> Email
                    </TabsTrigger>
                    <TabsTrigger value="phone">
                      <Phone className="h-4 w-4 mr-2" /> Phone
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat">
                    <form onSubmit={handleSubmitChat} className="space-y-4">
                      {subject && (
                        <div>
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="mt-1"
                            disabled
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="message">Your Message</Label>
                        <Textarea
                          id="message"
                          placeholder="How can we help you today?"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="min-h-[150px] mt-1"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <span className="animate-spin mr-2">⏳</span> Sending...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Send className="h-4 w-4 mr-2" /> Send Message
                          </span>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="email">
                    <form onSubmit={handleSubmitEmail} className="space-y-4">
                      <div>
                        <Label htmlFor="email">Your Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="What is your inquiry about?"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Please provide details about your issue"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="min-h-[150px] mt-1"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <span className="animate-spin mr-2">⏳</span> Sending...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" /> Send Email
                          </span>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="phone">
                    <form onSubmit={handleSubmitPhone} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">Reason for Call</Label>
                        <Input
                          id="subject"
                          placeholder="Brief description of your issue"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <span className="animate-spin mr-2">⏳</span> Submitting...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" /> Request Call Back
                          </span>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-center w-full text-muted-foreground">
                  Our support team typically responds within 24 hours on business days.
                </p>
              </CardFooter>
            </Card>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <h3 className="font-semibold flex items-center text-blue-700 dark:text-blue-300">
                <HelpCircle className="h-4 w-4 mr-2" /> Support Tips
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Include as much detail as possible about your issue</li>
                <li>• Mention any error messages you received</li>
                <li>• For listing issues, include the listing ID if available</li>
                <li>• Screenshots can be attached in email support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
