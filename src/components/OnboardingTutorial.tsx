
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from './ui/checkbox';

interface OnboardingTutorialProps {
  open: boolean;
  onClose: () => void;
}

export const OnboardingTutorial = ({ open, onClose }: OnboardingTutorialProps) => {
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(1);
    }
  }, [open]);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      if (dontShowAgain) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({ onboarding_completed: true })
              .eq('id', user.id);
          }
        } catch (error) {
          console.error('Error updating onboarding status:', error);
        }
      }
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
            <div className="mt-6 flex items-center space-x-2">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <label htmlFor="dont-show-again" className="text-sm text-gray-700 cursor-pointer">
                Don't show this again
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button onClick={handleNext}>
            {step === 3 ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
