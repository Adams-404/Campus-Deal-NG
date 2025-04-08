
import { motion } from "framer-motion";

export const StatsSection = () => {
  const stats = [
    { number: "1000+", label: "Active Users" },
    { number: "5000+", label: "Items Listed" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "24/7", label: "Support" }
  ];
  
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-950/30" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center p-6 rounded-xl border border-blue-200/10 backdrop-blur-sm hover:border-blue-200/20 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="text-4xl font-bold mb-2 text-blue-500">
                {stat.number}
              </div>
              <div className="text-white/80">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
