
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';
import { SafetyTips } from './SafetyTips';

interface OnboardingTutorialProps {
  open: boolean;
  onClose: () => void;
}

export const OnboardingTutorial = ({ open, onClose }: OnboardingTutorialProps) => {
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const { settings, updateSettings } = useSettings();

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      if (dontShowAgain) {
        try {
          await updateSettings({ 
            onboardingCompleted: true
          });
          toast.success('Onboarding preferences saved');
        } catch (error) {
          console.error('Error updating onboarding status:', error);
          toast.error('Failed to save preferences');
        }
      }
      
      // Show safety tips after onboarding
      setShowSafetyTips(true);
    }
  };

  const handleSafetyTipsClose = () => {
    setShowSafetyTips(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open && !showSafetyTips} onOpenChange={() => !showSafetyTips && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to GSU Market Hub!</DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Discover Products</h3>
              <p className="text-muted-foreground">
                Browse through various categories and find products you love.
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Sell Your Items</h3>
              <p className="text-muted-foreground">
                Easily list your own items for sale and manage your listings.
              </p>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Stay Connected</h3>
              <p className="text-muted-foreground">
                Message sellers directly and track your purchases.
              </p>
              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="dont-show-again"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="dont-show-again" className="text-sm text-gray-700">
                  Don't show this again
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={handleNext}>
              {step === 3 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <SafetyTips 
        open={showSafetyTips} 
        onClose={handleSafetyTipsClose} 
        scenario="general" 
      />
    </>
  );
};
