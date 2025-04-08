
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const CtaSection = () => {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="bg-blue-950/30 rounded-2xl p-12 text-center backdrop-blur-sm border border-blue-200/10 hover:border-blue-200/20 transition-all duration-300 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {/* Background gradient effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full filter blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
          </div>
          
          <div className="relative z-10">
            <motion.h2 
              className="text-3xl font-bold mb-4 text-white"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Ready to <span className="bg-orange-500 px-6 py-2 rounded-[15px] inline-block my-2">Start Trading</span>
            </motion.h2>
            
            <motion.p 
              className="text-white/80 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Join thousands of GSU students who are already buying and selling on our platform.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link to="/auth">
                <Button 
                  style={{ width: '200px' }} 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)" }}
                >
                  Join Now <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
