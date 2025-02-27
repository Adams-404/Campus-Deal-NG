import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Crown, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminActionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (email: string) => Promise<void>;
  action: 'add' | 'remove';
}

export function AdminActionModal({
  open,
  onClose,
  onConfirm,
  action,
}: AdminActionModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setEmail('');
      setError('');
      setIsLoading(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (action === 'add') {
      if (!email) {
        setError('Please enter the email address');
        return;
      }
      if (!email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
    }

    try {
      setIsLoading(true);
      await onConfirm(email);
      onClose();
    } catch (error) {
      console.error('Error in handleConfirm:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className={cn(
          "h-[90vh] sm:h-[500px]",
          "bg-secondary/50 backdrop-blur-sm",
          "border-t border-blue-500/30",
          "transition-all duration-300",
          "rounded-t-xl",
          "flex flex-col"
        )}
      >
        <SheetHeader className="space-y-3 mb-8">
          <SheetTitle className={cn(
            "flex items-center gap-2",
            "text-2xl font-bold",
            action === 'add' ? "text-blue-500" : "text-red-500"
          )}>
            {action === 'add' ? (
              <>
                <Crown className="w-6 h-6" />
                Add New Admin
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6" />
                Remove Admin
              </>
            )}
          </SheetTitle>
          <SheetDescription className="text-base">
            {action === 'add' 
              ? "Enter the email address of the user you want to make an admin."
              : "Are you sure you want to remove admin privileges from this user?"
            }
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {action === 'add' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  User Email
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter user's email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className={cn(
                    "bg-background/50",
                    "border-blue-500/20",
                    "focus:border-blue-500",
                    "transition-all duration-200",
                    "placeholder:text-muted-foreground/50"
                  )}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleConfirm();
                    }
                  }}
                />
                {error && (
                  <p className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="flex-shrink-0 gap-3 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className={cn(
              "flex-1 sm:flex-none",
              "border-blue-500/20 hover:bg-blue-500/10",
              "transition-all duration-200"
            )}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className={cn(
              "flex-1 sm:flex-none",
              "gap-2",
              action === 'add' 
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-red-500 hover:bg-red-600",
              "transition-all duration-200",
              "shadow-lg",
              action === 'add'
                ? "shadow-blue-500/25"
                : "shadow-red-500/25"
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {action === 'add' ? (
                  <>
                    <Crown className="w-4 h-4" />
                    Add Admin
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Remove Admin
                  </>
                )}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 