
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ShieldCheck, UserCheck, MapPin, MessageCircle, FileText, CreditCard, Info } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { useSettings } from '@/contexts/SettingsContext';

interface SafetyTipsDialogProps {
  open: boolean;
  onClose: () => void;
  trigger?: 'app_open' | 'message_seller' | 'sell';
}

export const SafetyTipsDialog = ({ open, onClose, trigger = 'app_open' }: SafetyTipsDialogProps) => {
  const [step, setStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { updateSafetyTipPreferences } = useSettings();

  // Different sets of tips based on the trigger, with icons
  const tipsByTrigger = useMemo(() => ({
    app_open: [
      {
        icon: <UserCheck className="h-5 w-5 text-blue-500" />,
        title: "Verify Identity",
        content: "Always verify the identity of the seller before buying the item listed."
      },
      {
        icon: <MapPin className="h-5 w-5 text-green-500" />,
        title: "Meet in Public",
        content: "Always meet in a public place on campus, such as the Love guarding, Science Complex or cafeterias."
      },
      {
        icon: <Info className="h-5 w-5 text-orange-500" />,
        title: "Trust Your Instincts",
        content: "If something feels off, walk away. It's better to be safe."
      }
    ],
    message_seller: [
      {
        icon: <MessageCircle className="h-5 w-5 text-purple-500" />,
        title: "Beware of Too-Good-To-Be-True Deals",
        content: "Unrealistically cheap prices are a red flag."
      },
      {
        icon: <ShieldCheck className="h-5 w-5 text-red-500" />,
        title: "Don't Share Personal Information",
        content: "Avoid sharing personal details like home address or financial information."
      },
      {
        icon: <Info className="h-5 w-5 text-orange-500" />,
        title: "Report Suspicious Behavior",
        content: "If a seller seems suspicious, report them and stop communication."
      }
    ],
    sell: [
      {
        icon: <FileText className="h-5 w-5 text-indigo-500" />,
        title: "Accurate Descriptions",
        content: "Be honest about the condition of your items to build trust and avoid disputes."
      },
      {
        icon: <CreditCard className="h-5 w-5 text-teal-500" />,
        title: "Safe Payment Methods",
        content: "Use safe payment methods and be wary of unusual payment requests."
      },
      {
        icon: <MapPin className="h-5 w-5 text-green-500" />,
        title: "Meet Safely",
        content: "Choose public meeting spots on campus for exchanges."
      }
    ]
  }), []); // useMemo to prevent recalculation on every render

  const tips = tipsByTrigger[trigger];
  const totalSteps = tips.length;
  const isLastStep = step === totalSteps;
  const progressValue = (step / totalSteps) * 100;

  useEffect(() => {
    if (!open) {
      setStep(1);
      setDontShowAgain(false);
    }
  }, [open]);

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      if (dontShowAgain) {
        // Update preferences in SettingsContext which handles the database update
        await updateSafetyTipPreferences(trigger, true);
      }
      onClose();
    }
  };

  const handleSkip = async () => {
    if (dontShowAgain) {
      // Update preferences in SettingsContext which handles the database update
      await updateSafetyTipPreferences(trigger, true);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-lg border border-blue-500">
        <DialogHeader>
          <DialogTitle>
            Safety Tips
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <Progress value={progressValue} className="w-full h-2 mb-4" />

        <div className="py-4 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">{tips[step - 1].icon}</div>
            <div>
              <h3 className="text-lg font-semibold">{tips[step - 1].title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{tips[step - 1].content}</p>
            </div>
          </div>

          {isLastStep && (
            <div className="pt-4 flex items-center space-x-2">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <label htmlFor="dont-show-again" className="text-sm text-gray-700 cursor-pointer">
                {trigger === 'app_open' 
                  ? "Don't show safety tips on startup" 
                  : trigger === 'sell'
                    ? "Don't show safety tips when selling"
                    : "Don't show safety tips when messaging"}
              </label>
            </div>
          )}
        </div>

        {/* Footer: Buttons and Step Info */}
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <span className="text-sm text-muted-foreground">
              Tip {step} of {totalSteps}
            </span>
            <Button onClick={handleNext}>
              {isLastStep ? 'Got it!' : 'Next Tip'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyTipsDialog;
