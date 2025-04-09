
import { motion } from "framer-motion";
import { MessageSquare, Search, ShoppingBag, Heart, Star, Image } from "lucide-react";

const FeatureShowcaseItem = ({ 
  icon: Icon, 
  title, 
  description, 
  mockupSrc, 
  color,
  reverse = false
}: { 
  icon: any, 
  title: string, 
  description: string, 
  mockupSrc: string,
  color: string,
  reverse?: boolean
}) => {
  return (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 py-16`}>
      <motion.div 
        className="md:w-1/2"
        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center mb-4`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="text-white/80 mb-6">{description}</p>
      </motion.div>
      
      <motion.div 
        className="md:w-1/2"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="relative w-[280px] h-[580px] bg-black rounded-[40px] p-4 shadow-xl border-[8px] border-gray-800 mx-auto"
          whileHover={{ 
            y: -10,
            transition: { duration: 0.3 }
          }}
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-3xl"></div>
          <div className="w-full h-full bg-blue-950 rounded-3xl overflow-hidden">
            <img 
              src={mockupSrc} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export const FeaturesShowcase = () => {
  return (
    <section className="py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-white">
            <span className="bg-purple-500 px-6 py-2 rounded-[15px] inline-block my-2">Featured Highlights</span>
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Discover the powerful features that make Tradezy the perfect platform for campus trading
          </p>
        </div>
        
        <div className="space-y-20">
          <FeatureShowcaseItem 
            icon={MessageSquare} 
            title="Seamless Messaging" 
            description="Connect directly with buyers and sellers through our secure in-app messaging system. Negotiate prices, ask questions, and arrange meetups all in one place."
            mockupSrc="/lovable-uploads/3d09554e-1f44-4e05-9545-7e7a1d225bca.png"
            color="bg-blue-500"
          />
          
          <FeatureShowcaseItem 
            icon={ShoppingBag} 
            title="Easy Listing Management" 
            description="Create, edit, and manage your listings with just a few taps. Add multiple photos, detailed descriptions, and set your preferred price and location."
            mockupSrc="/lovable-uploads/fa27c9e8-eb40-45a0-860c-afb4f30c6801.png"
            color="bg-green-500"
            reverse={true}
          />
          
          <FeatureShowcaseItem 
            icon={Search} 
            title="Advanced Search & Filters" 
            description="Find exactly what you're looking for with our powerful search functionality. Filter by category, price range, condition, and location to narrow down your options."
            mockupSrc="/lovable-uploads/84a45155-63a7-451e-b656-5d4600fe0673.png"
            color="bg-orange-500"
          />
          
          <FeatureShowcaseItem 
            icon={Heart} 
            title="Save Your Favorites" 
            description="Keep track of items you're interested in by saving them to your favorites. Get notified about price changes and availability updates."
            mockupSrc="/lovable-uploads/297c12be-24a7-418b-a660-db5801458751.png"
            color="bg-red-500"
            reverse={true}
          />
        </div>
      </div>
    </section>
  );
};
