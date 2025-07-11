
import { motion } from "framer-motion";

export const DeviceMockup = ({ type, image }: { type: 'mobile' | 'laptop'; image?: string }) => {
  const defaultImage = type === 'mobile' 
    ? "https://placehold.co/264x564/2563eb/FFFFFF?text=Campus+Deal+Mobile" 
    : "https://placehold.co/584x376/2563eb/FFFFFF?text=Campus+Deal+Desktop";
  
  const imageSrc = image || defaultImage;
  
  return (
    <motion.div
      className={`relative ${type === 'mobile' ? 'w-[280px]' : 'w-[600px]'} mx-auto my-8`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {type === 'mobile' ? (
        <div className="relative mx-auto">
          <div className="relative w-[280px] h-[580px] bg-black rounded-[40px] p-4 shadow-xl border-[8px] border-gray-800">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-3xl"></div>
            <div className="w-full h-full bg-blue-950 rounded-3xl overflow-hidden relative">
              <img 
                src={imageSrc} 
                alt="Campus Deal mobile interface" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/264x564/2563eb/FFFFFF?text=Campus+Deal+Mobile";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              {type === 'mobile' && (
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-medium">
                    Mobile Experience
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mx-auto">
          <div className="relative w-[600px] h-[400px] bg-gradient-to-b from-gray-800 to-black rounded-t-2xl p-4 pt-2 shadow-xl">
            <div className="w-full h-full bg-blue-950 rounded-lg overflow-hidden relative">
              <img 
                src={imageSrc} 
                alt="Campus Deal desktop interface" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/584x376/2563eb/FFFFFF?text=Campus+Deal+Desktop";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-gray-800 to-gray-900"></div>
          </div>
          <div className="w-[660px] h-[20px] mx-auto bg-gradient-to-b from-gray-900 to-gray-800 rounded-b-xl"></div>
          <div className="w-[550px] h-[5px] mx-auto bg-gradient-to-b from-gray-800 to-gray-700 rounded-b-xl"></div>
        </div>
      )}
    </motion.div>
  );
};
