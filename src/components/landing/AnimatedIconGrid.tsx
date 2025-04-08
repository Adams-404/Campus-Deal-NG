
import { motion } from "framer-motion";
import { ShoppingBag, MessageSquare, Heart, Search, Star, Zap } from "lucide-react";

export const AnimatedIconGrid = () => {
  const icons = [
    { Icon: ShoppingBag, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { Icon: MessageSquare, color: "text-green-500", bgColor: "bg-green-500/10" },
    { Icon: Heart, color: "text-red-500", bgColor: "bg-red-500/10" },
    { Icon: Search, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { Icon: Star, color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { Icon: Zap, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  ];

  return (
    <motion.div 
      className="grid grid-cols-3 sm:grid-cols-6 gap-4 my-12 max-w-3xl mx-auto px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className={`flex items-center justify-center p-4 rounded-xl ${item.bgColor} hover:scale-110 transition-all duration-300`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <item.Icon className={`w-8 h-8 ${item.color}`} />
        </motion.div>
      ))}
    </motion.div>
  );
};
