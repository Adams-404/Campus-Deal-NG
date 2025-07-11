
import { motion } from "framer-motion";
import { Shield, Users, BarChart2, MessageSquare, Search, ShoppingBag } from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure Trading",
      description: "Verified users and KYC process ensures safe transactions within our community.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Users,
      title: "Student Community",
      description: "Connect with fellow GSU students and trade with trust.",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: BarChart2,
      title: "Market Insights",
      description: "Stay updated with trending items and best deals on campus.",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      icon: MessageSquare,
      title: "Direct Messaging",
      description: "Chat securely with sellers and buyers within the platform.",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Find exactly what you need with our advanced search features.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: ShoppingBag,
      title: "Easy Listings",
      description: "List your items for sale in minutes with our streamlined process.",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    }
  ];
  
  return (
    <section className="py-24 bg-blue-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Why <span className="bg-blue-500 px-6 py-2 rounded-[15px] inline-block my-2">Choose Campus Deal</span>
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Experience the best of campus trading with our feature-rich platform designed specifically for GSU students.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white/5 p-6 rounded-xl border border-blue-200/10 backdrop-blur-sm hover:border-blue-200/20 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`${feature.bgColor} p-3 rounded-full w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${feature.color}`}>{feature.title}</h3>
              <p className="text-white/80">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
