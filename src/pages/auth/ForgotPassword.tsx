import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (isLoading) return; // Prevent double submission

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setIsEmailSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#0A0A0A] text-center">
        <div className="w-full max-w-md p-8 rounded-lg bg-gray-900/50 border border-gray-800">
          <div className="p-3 rounded-full bg-green-500/10 w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
          <p className="text-gray-300 mb-6">
            We've sent password reset instructions to <span className="text-blue-400">{email}</span>.
            Please check your email and follow the link to reset your password.
          </p>
          <Button
            onClick={() => navigate("/auth/signin")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#0A0A0A]">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-3 left-3"
      >
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="group relative px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:text-white border border-blue-500/30 hover:border-blue-500/70"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="relative flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="relative">Back</span>
          </div>
        </Button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col items-center justify-center p-4"
      >
        <div className="w-full max-w-md p-8 rounded-lg bg-gray-900/50 border border-gray-800">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-blue-500/10">
              <Mail className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          
          <h1 className="text-xl font-bold text-center bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text mb-2">
            Forgot Password?
          </h1>
          <p className="text-center text-gray-400 text-sm mb-8">
            Enter your email and we'll send you a link to reset your password
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-800 focus:border-blue-500/50 focus:ring-blue-500/20 h-11 text-sm w-full"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-11 text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-400">
            Remember your password?{" "}
            <Link 
              to="/auth/signin" 
              className="text-blue-500 hover:text-blue-400 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
