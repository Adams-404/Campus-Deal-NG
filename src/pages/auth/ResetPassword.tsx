import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setIsSuccess(true);
      
      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        navigate("/auth/signin");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset session
  useEffect(() => {
    const handleAuthStateChange = () => {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // User clicked the password reset link, they should be able to reset password
          return;
        }
        
        if (event === 'SIGNED_IN' && session) {
          // User is signed in, they can reset password
          return;
        }
        
        // For any other case, check if there's a valid session
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          toast.error("Invalid or expired password reset link");
          navigate("/auth/forgot-password");
        }
      });
    };

    handleAuthStateChange();
  }, [navigate]);

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#0A0A0A] text-center">
        <div className="w-full max-w-md p-8 rounded-lg bg-gray-900/50 border border-gray-800">
          <div className="p-3 rounded-full bg-green-500/10 w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Password Updated!</h2>
          <p className="text-gray-300 mb-6">
            Your password has been successfully updated. Redirecting you to sign in...
          </p>
          <Button
            onClick={() => navigate("/auth/signin")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#0A0A0A]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col items-center justify-center p-4"
      >
        <div className="w-full max-w-md p-8 rounded-lg bg-gray-900/50 border border-gray-800">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-blue-500/10">
              <Lock className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          
          <h1 className="text-xl font-bold text-center bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text mb-2">
            Reset Your Password
          </h1>
          <p className="text-center text-gray-400 text-sm mb-8">
            Enter your new password below
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-800 focus:border-blue-500/50 focus:ring-blue-500/20 h-11 text-sm w-full"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-800 focus:border-blue-500/50 focus:ring-blue-500/20 h-11 text-sm w-full"
                  required
                  minLength={8}
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
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
