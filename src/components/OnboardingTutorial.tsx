
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter, // Added for better button placement
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card components
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';

interface OnboardingTutorialProps {
  open: boolean;
  onClose: () => void;
}

export const OnboardingTutorial = ({ open, onClose }: OnboardingTutorialProps) => {
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const totalSteps = 3; // Keep track of total steps

  useEffect(() => {
    if (!open) {
      setStep(1);
    }
  }, [open]);

  // Check if the user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();
          
          if (data?.onboarding_completed) {
            // User has completed onboarding, close the dialog
            onClose();
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };

    if (open) {
      checkOnboardingStatus();
    }
  }, [open, onClose]);

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      if (dontShowAgain) {
        setIsLoading(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error } = await supabase
              .from('profiles')
              .update({ onboarding_completed: true })
              .eq('id', user.id);
            
            if (error) throw error;
            
            // Store in localStorage as a fallback
            // Store in localStorage as a fallback or secondary check
            localStorage.setItem("onboarding_completed", "true");

            toast({
              title: "Preferences Saved",
              description: "We won't show this tutorial again.",
            });
          }
        } catch (error) {
          console.error("Error updating onboarding status:", error);
          toast({
            title: "Error Saving Preference",
            description: "Could not save your preference. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
      onClose();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Tutorial steps content
  const tutorialSteps = [
    {
      title: "Discover & Find",
      description:
        "Explore items listed by fellow students. Use filters like category, price, and condition to find exactly what you need.",
      icon: "🔍", // Using emoji as icon
    },
    {
      title: "List & Sell Easily",
      description:
        "Got something to sell? Snap photos, add details, set your price, and list it in minutes. Manage your items easily.",
      icon: "💰",
    },
    {
      title: "Connect & Transact",
      description:
        "Chat securely with buyers or sellers. Get notified about messages and listing updates. Arrange meetups safely on campus.",
      icon: "💬",
    }
  ];

  const currentStepContent = tutorialSteps[step - 1];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Added rounded-lg for border radius */}
      <DialogContent className="sm:max-w-lg p-0 rounded-lg"> 
        <DialogHeader className="p-6 pb-4"> {/* Add padding */}
          <DialogTitle className="text-2xl font-semibold text-center">
            Welcome to Campus Deal!
          </DialogTitle>
           <p className="text-sm text-muted-foreground text-center">A quick guide to get you started.</p>
          <div className="pt-4">
             <Progress value={(step / totalSteps) * 100} className="h-1.5 w-full" /> {/* Slightly thinner */}
             <p className="text-xs text-muted-foreground text-center mt-1.5">
               Step {step} of {totalSteps}
             </p>
           </div>
        </DialogHeader>

        {/* Use Card for step content */}
        <Card className="border-none shadow-none rounded-none"> {/* Remove card borders/shadow */}
          <CardContent className="pt-0 pb-6 px-6"> {/* Adjust padding */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="text-6xl mt-2 mb-4"> {/* Larger icon */}
                {currentStepContent.icon}
              </div>
              <h3 className="text-xl font-semibold">
                {currentStepContent.title}
              </h3>
              <p className="text-sm text-muted-foreground px-4"> {/* Add horizontal padding */}
                {currentStepContent.description}
              </p>
            </div>

            {step === totalSteps && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <Checkbox
                  id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <label htmlFor="dont-show-again" className="text-sm cursor-pointer">
                  Don't show this again
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Use DialogFooter for buttons */}
        {/* Ensure footer also respects the bottom radius */}
        <DialogFooter className="flex justify-between p-6 pt-4 bg-muted/40 sm:bg-transparent rounded-b-lg">
          {step === 1 ? (
            // Removed misplaced comment from here
            <Button
              variant="ghost"
              onClick={onClose}
              className="mr-auto hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-200"
            > 
              Skip Tutorial
            </Button>
          ) : (
            <Button variant="outline" onClick={handlePrevious} className="mr-auto"> {/* Push Back to the left */}
              Back
            </Button>
          )}

          <Button onClick={handleNext} disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : step === totalSteps
              ? "Get Started!"
              : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
