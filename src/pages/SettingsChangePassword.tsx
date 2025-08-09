import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Headset, Loader2, Lock, Eye, EyeOff } from "lucide-react";

const SettingsChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth/signin");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You need to be signed in to change your password");
        navigate("/auth/signin");
        return;
      }

      // Re-authenticate using current password to confirm ownership
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email as string,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect or account uses social login");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success("Password updated successfully");
      navigate("/settings");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 ml-0 lg:ml-[300px] transition-all duration-300">
        <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="w-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-primary lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <h1 className="text-lg font-semibold absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">Change Password</h1>
            <div className="w-10 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/support')}
                className="text-[#1078a7] hover:text-[#1078a7]/80 bg-white/90 dark:bg-transparent shadow-sm"
              >
                <Headset className="h-6 w-6" />
              </Button>
            </div>
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="w-full max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-300">
        <PageTransition>
          <div className="pt-24 pb-32 mx-auto max-w-3xl">
            <div className="lg:bg-background/5 lg:rounded-xl lg:p-6 lg:border lg:border-white/10 lg:shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-orange-500/10">
                  <Lock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-base font-medium">Update your password</h2>
                  <p className="text-sm text-gray-500">Enter your current password to set a new one</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-11 bg-background/60 border-gray-800 focus:border-blue-500/50 focus:ring-blue-500/20 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      aria-label={showCurrent ? "Hide password" : "Show password"}
                    >
                      {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 bg-background/60 border-gray-800 focus:border-blue-500/50 focus:ring-blue-500/20 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Retype new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 bg-background/60 border-gray-800 focus:border-blue-500/50 focus:ring-blue-500/20 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>

                <div className="text-sm text-gray-500 mt-2">
                  Forgot your current password? Use the Forgot Password flow instead.
                </div>
              </form>
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default SettingsChangePassword;


