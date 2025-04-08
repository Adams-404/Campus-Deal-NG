
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export const AnimatedWords = () => {
  const words = [
    { text: "Buy", color: "text-blue-500" },
    { text: "Sell", color: "text-green-500" },
    { text: "Trade", color: "text-yellow-500" },
    { text: "Exchange", color: "text-orange-500" },
    { text: "Connect", color: "text-purple-500" },
    { text: "Share", color: "text-pink-500" },
    { text: "Browse", color: "text-cyan-500" },
    { text: "Discover", color: "text-indigo-500" },
    { text: "Chat", color: "text-red-500" },
    { text: "Network", color: "text-emerald-500" },
    { text: "List", color: "text-amber-500" },
    { text: "Promote", color: "text-violet-500" },
    { text: "Search", color: "text-teal-500" },
    { text: "Find", color: "text-fuchsia-500" },
    { text: "Save", color: "text-rose-500" },
    { text: "Collect", color: "text-blue-400" },
    { text: "Compare", color: "text-green-400" },
    { text: "Choose", color: "text-yellow-400" },
    { text: "Explore", color: "text-orange-400" },
    { text: "Learn", color: "text-purple-400" },
    { text: "Meet", color: "text-pink-400" },
    { text: "Greet", color: "text-cyan-400" },
    { text: "Post", color: "text-indigo-400" },
    { text: "Join", color: "text-red-400" },
    { text: "Create", color: "text-emerald-400" },
    { text: "Innovate", color: "text-amber-400" }
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-24 relative overflow-hidden">
      {words.map((word, index) => (
        <motion.span
          key={word.text}
          className={`absolute left-0 right-0 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold ${word.color}`}
          initial={{ y: 50, opacity: 0 }}
          animate={{
            y: index === currentIndex ? 0 : 50,
            opacity: index === currentIndex ? 1 : 0
          }}
          exit={{ y: -50, opacity: 0 }}
          transition={{
            y: { type: "spring", stiffness: 100, damping: 20 },
            opacity: { duration: 0.5 }
          }}
        >
          {word.text}
        </motion.span>
      ))}
    </div>
  );
};
