import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { 
  Info, 
  Users, 
  Target, 
  Star, 
  Github,
  Twitter,
  Linkedin,
  Mail,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const features = [
  {
    title: "Easy Listing",
    description: "List your items in seconds with our intuitive interface"
  },
  {
    title: "Secure Messaging",
    description: "Chat safely with buyers and sellers within the app"
  },
  {
    title: "Smart Categories",
    description: "Find what you need quickly with organized categories"
  },
  {
    title: "Local Community",
    description: "Connect with students and faculty in your university"
  }
];

const team = [
  {
    name: "John Doe",
    role: "Lead Developer",
    image: "/avatars/john.jpg",
    social: {
      github: "https://github.com/johndoe",
      twitter: "https://twitter.com/johndoe",
      linkedin: "https://linkedin.com/in/johndoe"
    }
  },
  {
    name: "Jane Smith",
    role: "UI/UX Designer",
    image: "/avatars/jane.jpg",
    social: {
      github: "https://github.com/janesmith",
      twitter: "https://twitter.com/janesmith",
      linkedin: "https://linkedin.com/in/janesmith"
    }
  }
];

export default function About() {
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
              className="h-9 w-9 rounded-full bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center">About GSU Market</h1>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32 space-y-6">
            {/* Mission */}
            <div className="bg-secondary/50 rounded-lg border border-white/10 p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-semibold">Our Mission</h2>
              </div>
              <p className="text-gray-400">
                GSU Market aims to create a safe and efficient marketplace for the university
                community. We're committed to making buying and selling within the campus
                easy, secure, and sustainable.
              </p>
            </div>

            {/* Features */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-semibold">Key Features</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-secondary/50 rounded-lg border border-white/10 p-4"
                  >
                    <h3 className="font-medium mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Team */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-semibold">Meet the Team</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {team.map((member, index) => (
                  <div
                    key={index}
                    className="bg-secondary/50 rounded-lg border border-white/10 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10" />
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-gray-400">{member.role}</p>
                        <div className="flex gap-2 mt-2">
                          <a
                            href={member.social.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                          <a
                            href={member.social.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <Twitter className="w-4 h-4" />
                          </a>
                          <a
                            href={member.social.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-4">Get in Touch</h2>
              <p className="text-gray-400 mb-6">
                Have questions or suggestions? We'd love to hear from you!
              </p>
              <Button className="gap-2">
                <Mail className="w-4 h-4" />
                Contact Us
              </Button>
            </div>

            {/* Version */}
            <div className="mt-12 text-center text-sm text-gray-400">
              <p>Version 1.0.0</p>
              <p className="mt-1">© 2024 GSU Market. All rights reserved.</p>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
} 