
import { motion } from "framer-motion";
import { 
  Shield, 
  Users, 
  Bell, 
  MessageSquare, 
  Search, 
  Heart,
  Settings,
  FileCheck,
  MapPin,
  Camera,
  Filter,
  Tag
} from "lucide-react";

export const AppFeaturesList = () => {
  const featureColumns = [
    {
      title: "Core Features",
      features: [
        { icon: Shield, text: "Secure Student-Only Platform" },
        { icon: MessageSquare, text: "In-App Messaging" },
        { icon: Search, text: "Advanced Search" },
        { icon: Heart, text: "Save Favorite Items" },
      ]
    },
    {
      title: "Trading",
      features: [
        { icon: Tag, text: "Sell Items Quickly" },
        { icon: Camera, text: "Multiple Product Photos" },
        { icon: FileCheck, text: "Item Categories" },
        { icon: MapPin, text: "Location Sharing" },
      ]
    },
    {
      title: "User Experience",
      features: [
        { icon: Users, text: "Community Profiles" },
        { icon: Bell, text: "Notifications" },
        { icon: Filter, text: "Customizable Filters" },
        { icon: Settings, text: "Personalized Settings" },
      ]
    }
  ];
  
  return (
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-white">
            All the <span className="bg-indigo-500 px-6 py-2 rounded-[15px] inline-block my-2">Features You Need</span>
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Campus Deal is packed with tools to help students buy, sell and connect
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {featureColumns.map((column, columnIndex) => (
            <motion.div 
              key={column.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: columnIndex * 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-blue-950/30 to-transparent p-6 rounded-xl border border-blue-200/10"
            >
              <h3 className="text-xl font-semibold mb-6 text-center text-white">{column.title}</h3>
              <ul className="space-y-4">
                {column.features.map((feature, featureIndex) => (
                  <motion.li 
                    key={feature.text}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: featureIndex * 0.1 + columnIndex * 0.2 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <feature.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-white/80 group-hover:text-white transition-colors">{feature.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
