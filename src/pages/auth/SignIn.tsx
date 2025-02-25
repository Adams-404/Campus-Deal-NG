import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, ArrowLeft, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#0A0A0A]">
      {/* Back Button - Positioned at the edge */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-3 left-3"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="group relative px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:text-white border border-blue-500/30 hover:border-blue-500/70"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="relative flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="relative">Back</span>
          </div>
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
        </Button>
      </motion.div>

      {/* Trust Indicators - At the top */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-md mx-auto mt-16 mb-8 grid grid-cols-3 gap-6 px-4"
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 rounded-full bg-blue-500/10">
            <ShieldCheck className="h-7 w-7 text-blue-500" />
          </div>
          <span className="text-sm font-medium text-gray-300">Secure</span>
        </div>
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 rounded-full bg-green-500/10">
            <User className="h-7 w-7 text-green-500" />
          </div>
          <span className="text-sm font-medium text-gray-300">Verified Users</span>
        </div>
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 rounded-full bg-orange-500/10">
            <Lock className="h-7 w-7 text-orange-500" />
          </div>
          <span className="text-sm font-medium text-gray-300">Encrypted</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col px-4"
      >
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-full bg-blue-500/10">
            <User className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        
        <h1 className="text-xl font-bold text-center bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-gray-400 text-sm mb-8">
          Sign in to your account to continue
        </p>

        <div className="w-full max-w-md mx-auto space-y-6">
          <Button 
            variant="outline" 
            type="button" 
            className="w-full group hover:border-blue-500/50 hover:bg-blue-500/5 text-sm h-11"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0A0A0A] px-2 text-gray-400">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-400 space-y-2">
            <Link to="/auth/forgot-password" className="block text-blue-500 hover:text-blue-400 underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
            <p>
              Don't have an account?{" "}
              <Link to="/auth/signup" className="text-blue-500 hover:text-blue-400 underline-offset-4 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;

