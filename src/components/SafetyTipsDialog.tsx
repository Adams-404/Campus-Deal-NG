
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SafetyTipsDialogProps {
  open: boolean;
  onClose: () => void;
  trigger?: 'app_open' | 'message_seller' | 'sell';
}

export const SafetyTipsDialog = ({ open, onClose, trigger = 'app_open' }: SafetyTipsDialogProps) => {
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Different sets of tips based on the trigger
  const tipsByTrigger = {
    app_open: [
      {
        title: "Verify Identity",
        content: "Always verify the identity of the seller before meeting. Ask for their GSU ID or other verification."
      },
      {
        title: "Meet in Public",
        content: "Always meet in a public place on campus, such as the Student Center or Library."
      },
      {
        title: "Tell a Friend",
        content: "Let a friend know where you're going and who you're meeting."
      }
    ],
    message_seller: [
      {
        title: "Keep Communication on Platform",
        content: "For your safety, keep all communications within the GSU Market Hub messaging system."
      },
      {
        title: "Don't Share Personal Information",
        content: "Avoid sharing personal details like home address or financial information."
      },
      {
        title: "Report Suspicious Behavior",
        content: "If a seller seems suspicious, report them and stop communication."
      }
    ],
    sell: [
      {
        title: "Accurate Descriptions",
        content: "Be honest about the condition of your items to build trust and avoid disputes."
      },
      {
        title: "Safe Payment Methods",
        content: "Use safe payment methods and be wary of unusual payment requests."
      },
      {
        title: "Meet Safely",
        content: "Choose public meeting spots on campus for exchanges."
      }
    ]
  };

  const tips = tipsByTrigger[trigger];
  const totalSteps = tips.length;

  useEffect(() => {
    if (!open) {
      setStep(1);
    }
  }, [open]);

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      if (dontShowAgain && trigger === 'app_open') {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({ hide_safety_tips: true })
              .eq('id', user.id);
          }
        } catch (error) {
          console.error('Error updating user preferences:', error);
        }
      }
      onClose();
    }
  };

  const handleSkip = async () => {
    if (dontShowAgain && trigger === 'app_open') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ hide_safety_tips: true })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error('Error updating user preferences:', error);
      }
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Safety Tips</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <h3 className="text-lg font-medium mb-4">{tips[step - 1].title}</h3>
          <p className="text-muted-foreground">{tips[step - 1].content}</p>
          
          {trigger === 'app_open' && (
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
          )}
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={handleNext}>
            {step === totalSteps ? 'Got it' : 'Next'}
          </Button>
        </div>

        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div 
              key={index}
              className={`h-2 w-2 rounded-full ${step === index + 1 ? 'bg-primary' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyTipsDialog;
