
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';

interface SafetyTipsProps {
  open: boolean;
  onClose: () => void;
  scenario?: 'general' | 'messaging' | 'selling';
}

export const SafetyTips = ({ open, onClose, scenario = 'general' }: SafetyTipsProps) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { settings, updateSettings } = useSettings();

  const getScenarioTips = () => {
    const generalTips = [
      {
        id: "tip-1",
        title: "Check Product Condition",
        content: "Always inspect items thoroughly before purchasing. Ask for additional photos if necessary.",
        type: "do",
      },
      {
        id: "tip-2",
        title: "Don't Share Personal Info",
        content: "Avoid sharing sensitive information with sellers, including your home address or financial details.",
        type: "dont",
      },
      {
        id: "tip-5",
        title: "Meet in Public Places",
        content: "For safety, always meet in well-lit, public areas for exchanges. Consider bringing a friend.",
        type: "do",
      }
    ];

    const messagingTips = [
      {
        id: "msg-1",
        title: "Keep Communication on Platform",
        content: "Always communicate within our messaging system to maintain a record of your conversations.",
        type: "do",
      },
      {
        id: "msg-2",
        title: "Don't Send Money Before Meeting",
        content: "Never send payment before inspecting the item. Be wary of sellers who insist on advance payment.",
        type: "dont",
      },
      {
        id: "msg-3",
        title: "Report Suspicious Behavior",
        content: "If a seller's messages seem suspicious, report them immediately through our platform.",
        type: "do",
      }
    ];

    const sellingTips = [
      {
        id: "sell-1",
        title: "Be Honest About Condition",
        content: "Accurately describe your item's condition and provide clear photos to avoid disputes.",
        type: "do",
      },
      {
        id: "sell-2",
        title: "Don't Accept Unverified Payments",
        content: "Be cautious of buyers who offer unverifiable payment methods or ask to pay later.",
        type: "dont",
      },
      {
        id: "sell-3",
        title: "Protect Your Privacy",
        content: "Remove personal or identifying information from photos of items you're selling.",
        type: "do",
      }
    ];

    switch(scenario) {
      case 'messaging':
        return messagingTips;
      case 'selling':
        return sellingTips;
      default:
        return generalTips;
    }
  };

  const tips = getScenarioTips();

  const handleNext = async () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      if (dontShowAgain) {
        try {
          let settingKey = 'showGeneralSafetyTips';
          if (scenario === 'messaging') settingKey = 'showMessageSafetyTips';
          if (scenario === 'selling') settingKey = 'showSellingSafetyTips';
          
          await updateSettings({ [settingKey]: false });
          toast.success('Your safety tip preferences have been updated');
        } catch (error) {
          console.error('Error updating safety tip preferences:', error);
        }
      }
      onClose();
    }
  };

  const getTitleByScenario = () => {
    switch(scenario) {
      case 'messaging':
        return "Messaging Safety Tips";
      case 'selling':
        return "Seller Safety Tips";
      default:
        return "GSU Market Hub Safety Tips";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitleByScenario()}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center space-y-4 min-h-[180px] w-full mx-0">
          <div className="flex items-center gap-3">
            {tips[currentTip].type === 'do' ? (
              <div className="p-2 bg-green-500/20 rounded-full">
                <Check className="w-6 h-6 text-green-500" />
              </div>
            ) : (
              <div className="p-2 bg-red-500/20 rounded-full">
                <X className="w-6 h-6 text-red-500" />
              </div>
            )}
            <h3 className={cn('text-xl font-bold', tips[currentTip].type === 'do' ? 'text-green-500' : 'text-red-500')}>
              {tips[currentTip].title}
            </h3>
          </div>
          <p className="text-center text-gray-700 dark:text-gray-300 text-base max-w-prose">
            {tips[currentTip].content}
          </p>
        </div>

        {currentTip === tips.length - 1 && (
          <div className="mt-4 flex items-center space-x-2">
            <input
              type="checkbox"
              id="dont-show-again"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="dont-show-again" className="text-sm text-gray-700 dark:text-gray-300">
              Don't show this again
            </label>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <div className="flex gap-1">
            {tips.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full",
                  index === currentTip ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                )}
              />
            ))}
          </div>
          <Button onClick={handleNext}>
            {currentTip === tips.length - 1 ? 'Got it' : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
