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
    name: "Muhammad Aliyu",
    role: "Founder and CEO",
    image: "https://llrmbyafcffporpjtbka.supabase.co/storage/v1/object/sign/team/Muhammad-Adamu.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lN2M5ZWEwNS1hZDNhLTQwYjgtODQ0Yy0yODJhYTNhMTVjYTMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0ZWFtL011aGFtbWFkLUFkYW11LnBuZyIsImlhdCI6MTc1MzEzNDI5NCwiZXhwIjo5MTMyNTU4Mjk0fQ.yy8YwgSWm6QW7OLLVMV2_3u4N_AWOko0mSa6Iw4tkF8",
    social: {
      github: "https://github.com/Adams-404",
      twitter: "https://x.com/_Adam_Alee",
      linkedin: "https://www.linkedin.com/in/mohammed-aliyu-853a7a254",
      instagram: "https://www.instagram.com/_adam_alee/",
      facebook: "https://web.facebook.com/muhammad.adamualiyu.311/",
      whatsapp: "09067063781",
      email: "muhammadadamualiyu33@gmail.com"
    }
  },
  {
    name: "Muhammad Muhammad Tukur",
    role: "Co-Founder",
    image: "https://llrmbyafcffporpjtbka.supabase.co/storage/v1/object/sign/team/MMT.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lN2M5ZWEwNS1hZDNhLTQwYjgtODQ0Yy0yODJhYTNhMTVjYTMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0ZWFtL01NVC5qcGciLCJpYXQiOjE3NTMxMzQ1NjQsImV4cCI6OTEzMjU1ODU2NH0.Ghn5vdTck_oW-qgLHRXfFcQphxXPVE441RvLwOjJ_CE",
    social: {
      github: "#",
      twitter: "#",
      linkedin: "#",
      instagram: "#",
      facebook: "#",
      whatsapp: "",
      email: ""
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 ml-0 lg:ml-[300px] transition-all duration-300">
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
            <h1 className="text-lg font-semibold flex-1 text-center">About Campus Deal</h1>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:ml-[300px] transition-all duration-300">
        <PageTransition>
          <div className="pt-24 pb-32 space-y-6">
            {/* Mission */}
            <div className="bg-secondary/50 rounded-lg border border-white/10 p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-semibold">Our Mission</h2>
              </div>
              <p className="text-gray-400">
                Campus Deal is the premier marketplace for the university community, connecting students and faculty to buy and sell items in a secure and convenient way. Our platform is designed specifically for campus life, making transactions simple and trustworthy.
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
                <h2 className="text-lg font-semibold">Meet the Founders</h2>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {team.map((member, index) => (
                  <div
                    key={index}
                    className="bg-secondary/50 rounded-lg border border-white/10 p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-primary/10">
                        {member.image ? (
                          <img 
                            src={member.image} 
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{member.name}</h3>
                        <p className="text-sm text-gray-400">{member.role}</p>
                        <div className="flex flex-wrap gap-3 mt-3">
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
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <Twitter className="w-4 h-4" />
                          </a>
                          <a
                            href={member.social.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                          <a
                            href={`mailto:${member.social.email}`}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                          <a
                            href={member.social.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-pink-500 transition-colors"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </a>
                          <a
                            href={member.social.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </a>
                          <a
                            href={`https://wa.me/${member.social.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-green-500 transition-colors"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
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
              <p className="mt-1"> 2025 Campus Deal. All rights reserved.</p>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
} 