
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Sparkles, ArrowRight, Clock, Shield, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const EmailConfirmed = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(20);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    // Start animations sequence
    const timer1 = setTimeout(() => setAnimationStep(1), 500);
    const timer2 = setTimeout(() => setAnimationStep(2), 1000);
    const timer3 = setTimeout(() => setAnimationStep(3), 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/home');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleRedirectNow = () => {
    navigate('/home');
  };

  const appFeatures = [
    {
      icon: Shield,
      title: "Secure Trading",
      description: "Safe and verified transactions with trusted users"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Connect with students from your campus and beyond"
    },
    {
      icon: Zap,
      title: "Instant Messaging",
      description: "Chat directly with buyers and sellers in real-time"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-500/30 rounded-full"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-2xl space-y-8 relative z-10">
        {/* Success Icon with Animation */}
        <motion.div 
          className="text-center relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="relative inline-block">
            <motion.div
              className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <CheckCircle className="w-16 h-16 text-white" />
            </motion.div>

            {/* Sparkle effects */}
            {animationStep >= 1 && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      top: `${32 + Math.sin(i * 45 * Math.PI / 180) * 60}px`,
                      left: `${64 + Math.cos(i * 45 * Math.PI / 180) * 60}px`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="space-y-3">
            <motion.h1 
              className="text-4xl font-bold bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-transparent bg-clip-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Email Confirmed! 🎉
            </motion.h1>
            
            <motion.p 
              className="text-gray-300 text-xl leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Welcome to Campus Deal! Your account is now verified and ready to use.
            </motion.p>
          </div>
        </motion.div>

        {/* App Features */}
        {animationStep >= 2 && (
          <motion.div 
            className="grid md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            {appFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 backdrop-blur-sm text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + index * 0.2 }}
                whileHover={{ scale: 1.05, borderColor: "rgb(59 130 246 / 0.7)" }}
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Countdown and Redirect */}
        {animationStep >= 3 && (
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
          >
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Redirecting in</span>
                <motion.span 
                  className="text-2xl font-bold text-blue-400"
                  key={countdown}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {countdown}
                </motion.span>
                <span className="text-gray-300">seconds</span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                  style={{ width: `${((20 - countdown) / 20) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>

              <Button 
                onClick={handleRedirectNow}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-base font-medium group"
              >
                <span className="relative">Start Trading Now</span>
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </div>

            <p className="text-gray-500 text-sm">
              Ready to discover amazing deals from students around you!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmed;
