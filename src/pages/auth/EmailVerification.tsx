
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle, ArrowLeft, Sparkles, Shield } from "lucide-react";
import { useEffect, useState } from "react";

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'your email';
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStep(1);
    }, 500);
    
    const timer2 = setTimeout(() => {
      setAnimationStep(2);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-500/30 rounded-full"
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

      {/* Back Button */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/auth/signup')}
          className="group relative px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:text-white border border-blue-500/30 hover:border-blue-500/70"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="relative flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="relative">Back</span>
          </div>
        </Button>
      </motion.div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Main Email Icon with Animation */}
        <motion.div 
          className="text-center relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="relative inline-block">
            <motion.div
              className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Mail className="w-12 h-12 text-white" />
              
              {/* Animated checkmark overlay */}
              <motion.div
                className="absolute inset-0 bg-green-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={animationStep >= 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.5 }}
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>
            </motion.div>

            {/* Sparkle effects */}
            {animationStep >= 2 && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 40}px`,
                      left: `${48 + Math.cos(i * 60 * Math.PI / 180) * 40}px`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
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
              className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-transparent bg-clip-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Check Your Email
            </motion.h1>
            
            <motion.p 
              className="text-gray-300 text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              We've sent a verification link to
            </motion.p>
            
            <motion.div
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p className="text-blue-400 font-medium break-all">{email}</p>
            </motion.div>
          </div>

          <motion.div 
            className="space-y-4 text-gray-400 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <div className="flex items-center justify-center space-x-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Click the link in your email to verify your account</span>
            </div>
            
            <div className="space-y-2">
              <p>• Check your spam folder if you don't see it</p>
              <p>• The link will expire in 24 hours</p>
              <p>• Make sure to complete verification to access all features</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <Button 
            onClick={() => navigate('/auth/signin')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-sm font-medium"
          >
            Continue to Sign In
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 h-12 text-sm"
          >
            Back to Home
          </Button>
        </motion.div>

        {/* Footer Note */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <p className="text-xs text-gray-500">
            Having trouble? Contact our{" "}
            <button 
              onClick={() => navigate('/support')}
              className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors"
            >
              support team
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default EmailVerification;
