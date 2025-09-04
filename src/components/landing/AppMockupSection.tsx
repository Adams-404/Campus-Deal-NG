
import { motion } from "framer-motion";

export const AppMockupSection = () => {
  // Using Supabase storage URLs instead of local paths
  const mobileScreen = "https://llrmbyafcffporpjtbka.supabase.co/storage/v1/object/public/mockups//hero_mobile.jpg"; // Food app mockup
  const desktopScreen = "https://llrmbyafcffporpjtbka.supabase.co/storage/v1/object/public/mockups//hero_desktop.png"; // Desktop mockup
  
  return (
    <section className="py-12 bg-gradient-to-b from-blue-950/30 to-black relative overflow-hidden"> {/* Reduced vertical padding */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white inline-flex items-center mb-6">
         Device <span className="bg-blue-500 px-6 py-2 rounded-[15px] inline-block my-0 ml-2">Experience</span>
        </h2>


          <p className="text-white/80 max-w-2xl mx-auto">
            Access Campus Deal on any device. Our responsive design ensures a seamless experience whether you're on mobile or desktop.
          </p>
        </div>
        
        {/* Overlapping device mockups layout - responsive for both mobile and desktop */}
        <div className="relative max-w-5xl mx-auto min-h-[500px] md:min-h-[450px]">
          
          {/* Desktop mockup */}
          <motion.div 
  className="absolute right-0 md:right-0 top-[58%] md:top-[5%] w-[90%] md:w-[75%] z-10 md:translate-y-32"

            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="w-full aspect-video bg-gradient-to-b from-gray-800 to-black rounded-t-2xl p-2 shadow-2xl">
              <div className="w-full h-full bg-blue-950 rounded-lg overflow-hidden">
                <img 
                  src={desktopScreen} 
                  alt="Campus Deal desktop interface" 
                  className="w-full h-full object-cover object-top"
                  fetchpriority="high" 
                  decoding="async"
                />
              </div>
              <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-b from-gray-800 to-gray-900"></div>
            </div>
            <div className="w-full h-[10px] mx-auto bg-gradient-to-b from-gray-900 to-gray-800 rounded-b-xl"></div>
            <div className="w-[80%] h-[3px] mx-auto bg-gradient-to-b from-gray-800 to-gray-700 rounded-b-xl"></div>
          </motion.div>

          {/* Mobile mockup - positioned to overlap with desktop on larger screens */}
          <motion.div 
            className="absolute left-4 md:left-0 top-0 w-[220px] md:w-[240px] z-20"
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
              <div className="relative w-full h-[440px] bg-black rounded-[30px] p-1.5 shadow-2xl border-[4px] border-gray-800">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black rounded-b-xl z-10"></div>
                <div className="w-full h-full bg-blue-950 rounded-3xl overflow-hidden">
                  <img 
                  src={mobileScreen} 
                  alt="Campus Deal mobile interface" 
                  className="w-full h-full object-cover object-center"
                  fetchpriority="high"
                  decoding="async"
                />
              </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
          
        {/* Experience labels */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-8"> {/* Reduced margin-top */}
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
    </section>
  );
};
