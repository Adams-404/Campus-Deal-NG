
import { useState, useEffect } from "react";

export const TypewriterText = () => {
  const [displayText, setDisplayText] = useState("");
  const phrases = ["Connect & Exchange.", "Buy & Sell.", "Trade & Grow.", "Tradezy."];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    let currentIndex = 0;
    let isDeleting = false;
    let interval: NodeJS.Timeout;

    const startTyping = () => {
      interval = setInterval(() => {
        if (!isDeleting && currentIndex <= currentPhrase.length) {
          setDisplayText(currentPhrase.slice(0, currentIndex));
          currentIndex++;
          if (currentIndex > currentPhrase.length) {
            isDeleting = true;
            clearInterval(interval);
            setTimeout(() => {
              startTyping();
            }, 1500);
          }
        } else if (isDeleting && currentIndex >= 0) {
          setDisplayText(currentPhrase.slice(0, currentIndex));
          currentIndex--;
          if (currentIndex === 0) {
            isDeleting = false;
            setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
          }
        }
      }, 100);
    };

    startTyping();
    return () => clearInterval(interval);
  }, [currentPhraseIndex]);

  return (
    <div className="min-h-[3em] flex items-center justify-center px-4">
      <span className="inline-block whitespace-nowrap text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-white text-transparent bg-clip-text">
        {displayText}
        <span className="animate-pulse text-blue-500">|</span>
      </span>
    </div>
  );
};
