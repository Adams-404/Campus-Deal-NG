
import { motion } from "framer-motion";
import { Users, ShoppingBag, Star, Bot } from "lucide-react"; // Changed Robot to Bot
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// Animated counter component
const CountUp = ({ end, duration = 2 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-100px" });
  
  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    let animationFrame: number;
    
    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };
    
    animationFrame = requestAnimationFrame(updateCount);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isInView]);
  
  return <span ref={nodeRef}>{count}</span>;
};

export const StatsSection = () => {
  const stats = [
    { number: 1000, label: "Active Users", icon: Users, color: "bg-blue-500", textColor: "text-blue-400" },
    { number: 5000, label: "Items Listed", icon: ShoppingBag, color: "bg-green-500", textColor: "text-green-400" },
    { number: 98, label: "Satisfaction Rate", icon: Star, color: "bg-orange-500", textColor: "text-orange-400", suffix: "%" },
    { label: "AI Assistant", icon: Bot, color: "bg-purple-500", textColor: "text-purple-400", specialText: "24/7" } // Changed Robot to Bot
  ];
  
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-950/30" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center p-8 rounded-xl border border-blue-200/10 backdrop-blur-sm hover:border-blue-200/20 transition-all duration-300 bg-black/20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.1)" 
              }}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className={`text-4xl font-bold mb-2 ${stat.textColor} flex justify-center items-center`}>
                {stat.specialText ? (
                  <span>{stat.specialText}</span>
                ) : (
                  <>
                    <CountUp end={stat.number} />
                    {stat.suffix && <span>{stat.suffix}</span>}
                  </>
                )}
              </div>
              <div className="text-white/80 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
