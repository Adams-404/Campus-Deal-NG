
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import EmojiPicker from "emoji-picker-react";
import { useClickAway } from "@/hooks/useClickAway";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const MessageInput = ({ 
  onSend, 
  disabled = false, 
  placeholder = "Type a message...", 
  className 
}: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  useClickAway(emojiPickerRef, () => setShowEmojiPicker(false));

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setMessage(prev => prev + emojiObject.emoji);
  };

  return (
    <div className={cn("relative flex w-full items-end gap-2", className)}>
      <div className="relative flex-1">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "dark:bg-muted/50 dark:border-white/10",
            "light:bg-white light:border-gray-300 light:shadow-sm"
          )}
          style={{ minHeight: "44px", maxHeight: "120px" }}
        />
        <div className="absolute bottom-1.5 left-2">
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            className={cn(
              "h-6 w-6 rounded-full",
              "dark:hover:bg-muted",
              "light:hover:bg-gray-100"
            )}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="h-4 w-4" />
          </Button>
          {showEmojiPicker && (
            <div 
              ref={emojiPickerRef} 
              className="absolute bottom-8 left-0 z-50"
            >
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>
      </div>
      <Button 
        type="button" 
        size="icon" 
        onClick={handleSend} 
        disabled={disabled || !message.trim()}
        className={cn(
          "rounded-full h-9 w-9",
          "dark:bg-primary dark:text-primary-foreground",
          "light:bg-[#1EAEDB] light:text-white light:hover:bg-[#1EAEDB]/90"
        )}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};
