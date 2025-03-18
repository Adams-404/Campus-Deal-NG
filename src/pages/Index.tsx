import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  BarChart2, 
  Shield, 
  Users, 
  CheckCircle2, 
  Zap,
  MessageSquare,
  Search,
  ShoppingBag,
  Star,
  Heart,
  Github
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

// Enhanced Typewriter animation component
const TypewriterText = () => {
  const [displayText, setDisplayText] = useState("");
  const phrases = ["Connect & Exchange.", "Buy & Sell.", "Trade & Grow.", "Tradezy."];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex <= currentPhrase.length) {
        setDisplayText(currentPhrase.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }, 2000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentPhraseIndex]);

  return (
    <div className="min-h-[3em] flex items-center justify-center px-4">
      <span className="inline-block whitespace-nowrap text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-white text-transparent bg-clip-text">
        {displayText}
        <span className="animate-pulse text-blue-500">|</span>
      </span>
    </div>
  );
};

// Add new animated words component
const AnimatedWords = () => {
  const words = [
    { text: "Buy", color: "text-blue-500" },
    { text: "Sell", color: "text-green-500" },
    { text: "Trade", color: "text-yellow-500" },
    { text: "Exchange", color: "text-orange-500" },
    { text: "Connect", color: "text-purple-500" },
    { text: "Share", color: "text-pink-500" },
    { text: "Browse", color: "text-cyan-500" },
    { text: "Discover", color: "text-indigo-500" },
    { text: "Chat", color: "text-red-500" },
    { text: "Network", color: "text-emerald-500" },
    { text: "List", color: "text-amber-500" },
    { text: "Promote", color: "text-violet-500" },
    { text: "Search", color: "text-teal-500" },
    { text: "Find", color: "text-fuchsia-500" },
    { text: "Save", color: "text-rose-500" },
    { text: "Collect", color: "text-blue-400" },
    { text: "Compare", color: "text-green-400" },
    { text: "Choose", color: "text-yellow-400" },
    { text: "Explore", color: "text-orange-400" },
    { text: "Learn", color: "text-purple-400" },
    { text: "Meet", color: "text-pink-400" },
    { text: "Greet", color: "text-cyan-400" },
    { text: "Post", color: "text-indigo-400" },
    { text: "Join", color: "text-red-400" },
    { text: "Create", color: "text-emerald-400" },
    { text: "Innovate", color: "text-amber-400" }
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 2000); // Reduced delay to 2 seconds since we have more words

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-24 relative overflow-hidden">
      {words.map((word, index) => (
        <motion.span
          key={word.text}
          className={`absolute left-0 right-0 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold ${word.color}`}
          initial={{ y: 50, opacity: 0 }}
          animate={{
            y: index === currentIndex ? 0 : 50,
            opacity: index === currentIndex ? 1 : 0
          }}
          exit={{ y: -50, opacity: 0 }}
          transition={{
            y: { type: "spring", stiffness: 100, damping: 20 },
            opacity: { duration: 0.5 }
          }}
        >
          {word.text}
        </motion.span>
      ))}
    </div>
  );
};

const features = [
  {
    icon: Shield,
    title: "Secure Trading",
    description: "Verified users and KYC process ensures safe transactions within our community.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    icon: Users,
    title: "Student Community",
    description: "Connect with fellow GSU students and trade with trust.",
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  {
    icon: BarChart2,
    title: "Market Insights",
    description: "Stay updated with trending items and best deals on campus.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    description: "Chat securely with sellers and buyers within the platform.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find exactly what you need with our advanced search features.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    icon: ShoppingBag,
    title: "Easy Listings",
    description: "List your items for sale in minutes with our streamlined process.",
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  }
];

const stats = [
  { number: "1000+", label: "Active Users" },
  { number: "5000+", label: "Items Listed" },
  { number: "98%", label: "Satisfaction Rate" },
  { number: "24/7", label: "Support" }
];

const testimonials = [
  {
    quote: "Tradezy has made buying and selling textbooks so much easier! The verification process makes me feel safe.",
    author: "Aisha M.",
    role: "Computer Science Student"
  },
  {
    quote: "I love how easy it is to find what I need. The direct messaging feature is super convenient!",
    author: "Fatima B.",
    role: "Business Major"
  },
  {
    quote: "Best platform for campus trading! The community is great and prices are reasonable.",
    author: "Mohammed S.",
    role: "Graduate Student"
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/80 to-blue-950/30" />
        <div className="absolute inset-0">
          <svg
            className="absolute inset-0 h-full w-full opacity-30"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Small circles */}
            <circle cx="20" cy="20" r="3" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.5" />
            <circle cx="80" cy="30" r="2" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.5" />
            <circle cx="40" cy="80" r="2.5" fill="none" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="0.5" />
            
            {/* Small diamonds */}
            <path d="M 70 30 L 72 32 L 70 34 L 68 32 Z" fill="none" stroke="rgba(234, 179, 8, 0.4)" strokeWidth="0.5" />
            <path d="M 25 60 L 27 62 L 25 64 L 23 62 Z" fill="none" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.5" />
            
            {/* Small squares */}
            <rect x="75" y="70" width="3" height="3" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.5" transform="rotate(45, 76.5, 71.5)" />
            <rect x="15" y="40" width="2" height="2" fill="none" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="0.5" transform="rotate(30, 16, 41)" />
            
            {/* Small triangles */}
            <path d="M 85 45 L 87 48 L 83 48 Z" fill="none" stroke="rgba(234, 179, 8, 0.4)" strokeWidth="0.5" />
            <path d="M 35 25 L 37 28 L 33 28 Z" fill="none" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.5" />
          </svg>
        </div>
        
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center flex flex-col items-center justify-center min-h-[80vh]">
            <motion.div 
              className="w-full mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <TypewriterText />
            </motion.div>

            <motion.div
              className="w-full mb-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <AnimatedWords />
            </motion.div>

            <motion.p 
              className="text-base sm:text-lg md:text-xl text-white/90 max-w-xl mx-auto px-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Your platform for trading within the GSU community. Buy, sell, and exchange with confidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link to="/auth">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  Get Started <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-blue-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-white">
              Why <span className="bg-blue-500 px-6 py-2 rounded-[15px] inline-block my-2">Choose Tradezy</span>
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Experience the best of campus trading with our feature-rich platform designed specifically for GSU students.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-white/5 p-6 rounded-xl border border-blue-200/10 backdrop-blur-sm hover:border-blue-200/20 transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className={`${feature.bgColor} p-3 rounded-full w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${feature.color}`}>{feature.title}</h3>
                <p className="text-white/80">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-950/30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center p-6 rounded-xl border border-blue-200/10 backdrop-blur-sm hover:border-blue-200/20 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-4xl font-bold mb-2 text-blue-500">
                  {stat.number}
                </div>
                <div className="text-white/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-blue-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-white">
              What <span className="bg-green-500 px-6 py-2 rounded-[15px] inline-block my-2">Students Say</span>
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Hear from our community of GSU students who use our platform daily.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                className="bg-white/5 p-6 rounded-xl border border-blue-200/10 backdrop-blur-sm hover:border-blue-200/20 transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="inline-block w-4 h-4 text-blue-500 fill-blue-500" />
                  ))}
                </div>
                <p className="text-white/80 mb-4">{testimonial.quote}</p>
                <div>
                  <div className="font-semibold text-blue-500">{testimonial.author}</div>
                  <div className="text-sm text-white/60">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-950/30 rounded-2xl p-12 text-center backdrop-blur-sm border border-blue-200/10 hover:border-blue-200/20 transition-all duration-300">
            <h2 className="text-3xl font-bold mb-4 text-white">
              Ready to <span className="bg-orange-500 px-6 py-2 rounded-[15px] inline-block my-2">Start Trading</span>
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of GSU students who are already buying and selling on our platform.
            </p>
            <Link to="/auth">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                Join Now <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4 text-blue-500">
                Tradezy
              </h3>
              <p className="text-sm text-white/80">
                Your trusted platform for campus trading at Gombe State University.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-blue-500">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><Link to="/about" className="hover:text-blue-500 transition-colors">About Us</Link></li>
                <li><Link to="/help" className="hover:text-green-500 transition-colors">Help Center</Link></li>
                <li><Link to="/privacy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/feedback" className="hover:text-red-500 transition-colors">Feedback</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-green-500">Features</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li className="hover:text-blue-500 transition-colors">Secure Trading</li>
                <li className="hover:text-green-500 transition-colors">Student Verification</li>
                <li className="hover:text-orange-500 transition-colors">Direct Messaging</li>
                <li className="hover:text-red-500 transition-colors">Smart Search</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-orange-500">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-white/80 hover:text-blue-500 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-white/80 hover:text-green-500 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </a>
                <a href="#" className="text-white/80 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-blue-200/10 text-center text-sm text-white/60">
            <p>&copy; {new Date().getFullYear()} Tradezy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
