
import { ArrowRight, Ghost, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TypewriterText } from "./TypewriterText";
import { AnimatedWords } from "./AnimatedWords";
import { AnimatedPattern } from "./AnimatedPattern";

export const HeroSection = () => {
  return (
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
            Your platform for trading within your campus community. Buy, sell, and exchange with confidence.
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
  );
};
