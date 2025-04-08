
import { motion } from "framer-motion";

export const AnimatedPattern = () => {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-20"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M0,0 L100,0 L100,100 L0,100 Z"
        fill="none"
        stroke="rgba(59, 130, 246, 0.4)"
        strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      <motion.circle
        cx="20"
        cy="20"
        r="5"
        fill="none"
        stroke="rgba(59, 130, 246, 0.4)"
        strokeWidth="0.5"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.5 }}
      />
      <motion.rect
        x="70"
        y="70"
        width="10"
        height="10"
        fill="none"
        stroke="rgba(34, 197, 94, 0.4)"
        strokeWidth="0.5"
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 180, opacity: 1 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1 }}
      />
    </svg>
  );
};
