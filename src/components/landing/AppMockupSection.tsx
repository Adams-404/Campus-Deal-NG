
import { motion } from "framer-motion";
import { DeviceMockup } from "./DeviceMockup";

export const AppMockupSection = () => {
  // Single image for each mockup device
  const mobileScreen = "/lovable-uploads/f86acf39-8d5c-44eb-b019-02cc3cf797ce.png"; // Food app mockup
  const desktopScreen = "/lovable-uploads/0c7613ff-7d84-43c5-b64c-c82051ab6cfa.png"; // Existing desktop mockup
  
  return (
    <section className="py-16 bg-gradient-to-b from-blue-950/30 to-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-white">
            <span className="bg-blue-500 px-6 py-2 rounded-[15px] inline-block my-2">Cross-device Experience</span>
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Access Tradezy on any device. Our responsive design ensures a seamless experience whether you're on mobile or desktop.
          </p>
        </div>
        
        <div className="relative">
          {/* Modern device mockup layout with overlapping designs */}
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-start relative max-w-5xl mx-auto">
            {/* Mobile mockup */}
            <motion.div 
              className="md:ml-6 z-10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <div className="relative w-[280px] h-[580px] bg-black rounded-[40px] p-4 shadow-xl border-[8px] border-gray-800 mx-auto">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-3xl"></div>
                  <div className="w-full h-full bg-blue-950 rounded-3xl overflow-hidden">
                    <img 
                      src={mobileScreen} 
                      alt="Tradezy mobile interface" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Desktop mockup - positioned to overlap slightly */}
            <motion.div 
              className="md:ml-[-60px] md:mt-24 mt-[-80px] z-0 relative max-w-full"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="w-full md:w-[500px] mx-auto overflow-visible">
                <div className="relative w-full aspect-video bg-gradient-to-b from-gray-800 to-black rounded-t-2xl p-2 shadow-xl">
                  <div className="w-full h-full bg-blue-950 rounded-lg overflow-hidden">
                    <img 
                      src={desktopScreen} 
                      alt="Tradezy desktop interface" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-b from-gray-800 to-gray-900"></div>
                </div>
                <div className="w-full h-[10px] mx-auto bg-gradient-to-b from-gray-900 to-gray-800 rounded-b-xl"></div>
                <div className="w-[80%] h-[3px] mx-auto bg-gradient-to-b from-gray-800 to-gray-700 rounded-b-xl"></div>
              </div>
            </motion.div>
          </div>
          
          {/* Experience labels */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <span className="h-3 w-3 rounded-full bg-blue-400"></span>
              <span className="text-blue-400 font-medium">Mobile Experience</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <span className="h-3 w-3 rounded-full bg-green-400"></span>
              <span className="text-green-400 font-medium">Desktop Experience</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
