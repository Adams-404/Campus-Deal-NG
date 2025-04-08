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
  Github,
  Ghost,
  Smartphone,
  Laptop,
  Image,
  ArrowDown
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

const TypewriterText = () => {
  const [displayText, setDisplayText] = useState("");
  const phrases = ["Connect & Exchange.", "Buy & Sell.", "Trade & Grow.", "Tradezy."];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    let currentIndex = 0;
    let isDeleting = false;
    let interval: NodeJS.Timeout;

    const startTyping = () => {
      interval = setInterval(() => {
        if (!isDeleting && currentIndex <= currentPhrase.length) {
          setDisplayText(currentPhrase.slice(0, currentIndex));
          currentIndex++;
          if (currentIndex > currentPhrase.length) {
            isDeleting = true;
            clearInterval(interval);
            setTimeout(() => {
              startTyping();
            }, 1500);
          }
        } else if (isDeleting && currentIndex >= 0) {
          setDisplayText(currentPhrase.slice(0, currentIndex));
          currentIndex--;
          if (currentIndex === 0) {
            isDeleting = false;
            setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
          }
        }
      }, 100);
    };

    startTyping();
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
    }, 2000);

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

const DeviceMockup = ({ type }: { type: 'mobile' | 'laptop' }) => {
  return (
    <motion.div
      className={`relative ${type === 'mobile' ? 'w-[280px]' : 'w-[600px]'} mx-auto my-8`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {type === 'mobile' ? (
        <div className="relative mx-auto">
          <div className="relative w-[280px] h-[580px] bg-black rounded-[40px] p-4 shadow-xl border-[8px] border-gray-800">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-3xl"></div>
            <div className="w-full h-full bg-blue-950 rounded-3xl overflow-hidden relative">
              <img 
                src="/mobile-mockup.png" 
                alt="Tradezy mobile interface" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/264x564/2563eb/FFFFFF?text=Tradezy+Mobile";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-medium">
                  Mobile Experience
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mx-auto">
          <div className="relative w-[600px] h-[400px] bg-gradient-to-b from-gray-800 to-black rounded-t-2xl p-4 pt-2 shadow-xl">
            <div className="w-full h-full bg-blue-950 rounded-lg overflow-hidden relative">
              <img 
                src="/laptop-mockup.png" 
                alt="Tradezy desktop interface" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/584x376/2563eb/FFFFFF?text=Tradezy+Desktop";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-gray-800 to-gray-900"></div>
          </div>
          <div className="w-[660px] h-[20px] mx-auto bg-gradient-to-b from-gray-900 to-gray-800 rounded-b-xl"></div>
          <div className="w-[550px] h-[5px] mx-auto bg-gradient-to-b from-gray-800 to-gray-700 rounded-b-xl"></div>
        </div>
      )}
    </motion.div>
  );
};

const AnimatedPattern = () => {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-20"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M0,0 L100,0 L100,100 L0,100 Z"
        fill="none"
        stroke="rgba(59, 130, 246, 0.4)"
        strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      <motion.circle
        cx="20"
        cy="20"
        r="5"
        fill="none"
        stroke="rgba(59, 130, 246, 0.4)"
        strokeWidth="0.5"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.5 }}
      />
      <motion.rect
        x="70"
        y="70"
        width="10"
        height="10"
        fill="none"
        stroke="rgba(34, 197, 94, 0.4)"
        strokeWidth="0.5"
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 180, opacity: 1 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1 }}
      />
    </svg>
  );
};

const AnimatedIconGrid = () => {
  const icons = [
    { Icon: ShoppingBag, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { Icon: MessageSquare, color: "text-green-500", bgColor: "bg-green-500/10" },
    { Icon: Heart, color: "text-red-500", bgColor: "bg-red-500/10" },
    { Icon: Search, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { Icon: Star, color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { Icon: Zap, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  ];

  return (
    <motion.div 
      className="grid grid-cols-3 sm:grid-cols-6 gap-4 my-12 max-w-3xl mx-auto px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className={`flex items-center justify-center p-4 rounded-xl ${item.bgColor} hover:scale-110 transition-all duration-300`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <item.Icon className={`w-8 h-8 ${item.color}`} />
        </motion.div>
      ))}
    </motion.div>
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
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-foreground">
        <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/80 to-blue-950/30" />
          <AnimatedPattern />
          
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
                <div className="flex flex-col items-center gap-4">
                  <Link to="/auth/signup">
                    <Button variant="outline" className="w-48 border-blue-500 hover:border-blue-600">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/home">
                    <Button variant="outline" className="w-48 border-green-500 hover:border-green-600">
                      <Ghost className="mr-2 h-4 w-4" />
                      Explore as Guest
                    </Button>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div
                className="absolute bottom-8 left-0 right-0 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
              >
                <ArrowDown className="w-6 h-6 text-blue-500 animate-bounce" />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-b from-blue-950/30 to-black relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">
                <span className="bg-blue-500 px-6 py-2 rounded-[15px] inline-block my-2">Cross-device Experience</span>
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                Access Tradezy on any device. Our responsive design ensures a seamless experience whether you're on mobile or desktop.
              </p>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              <div className="lg:w-1/2">
                <DeviceMockup type="mobile" />
              </div>
              <div className="lg:w-1/2">
                <DeviceMockup type="laptop" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-black relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Everything You <span className="bg-green-500 px-6 py-2 rounded-[15px] inline-block my-2">Need</span>
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                Powerful tools to help you buy, sell and connect with other students
              </p>
            </div>
            
            <AnimatedIconGrid />
          </div>
        </section>

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
                <Button style={{ width: '200px' }} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  Join Now <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

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
    </PageTransition>
  );
};

export default Index;
