
import { motion } from "framer-motion";
import { ImageCarousel } from "@/components/ui/image-carousel";

export const AppMockupSection = () => {
  const mobileScreens = [
    "/mockups/mobile-home.png",
    "/mockups/mobile-messages.png",
    "/mockups/mobile-profile.png",
    "/mockups/mobile-product.png",
    "/mockups/mobile-search.png",
  ];
  
  const desktopScreens = [
    "/mockups/desktop-home.png",
    "/mockups/desktop-messages.png",
    "/mockups/desktop-profile.png",
    "/mockups/desktop-listings.png",
  ];
  
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
        
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-16">
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-center text-blue-400">Mobile Experience</h3>
            {/* Animated Mobile Carousel */}
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
              className="relative w-[300px] mx-auto"
            >
              <div className="relative w-[300px] h-[600px] mx-auto">
                <div className="relative w-[280px] h-[580px] bg-black rounded-[40px] p-4 shadow-xl border-[8px] border-gray-800 mx-auto">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-3xl"></div>
                  <div className="w-full h-full bg-blue-950 rounded-3xl overflow-hidden">
                    <ImageCarousel 
                      images={mobileScreens} 
                      aspectRatio="full"
                      showControls={true}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-center text-green-400">Desktop Experience</h3>
            {/* Desktop Mockup */}
            <div className="relative mx-auto">
              <div className="relative w-[600px] h-[400px] bg-gradient-to-b from-gray-800 to-black rounded-t-2xl p-4 pt-2 shadow-xl">
                <div className="w-full h-full bg-blue-950 rounded-lg overflow-hidden">
                  <ImageCarousel 
                    images={desktopScreens} 
                    aspectRatio="video"
                    showControls={true}
                  />
                </div>
                <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-gray-800 to-gray-900"></div>
              </div>
              <div className="w-[660px] h-[20px] mx-auto bg-gradient-to-b from-gray-900 to-gray-800 rounded-b-xl"></div>
              <div className="w-[550px] h-[5px] mx-auto bg-gradient-to-b from-gray-800 to-gray-700 rounded-b-xl"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
