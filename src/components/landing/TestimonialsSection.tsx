
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

export const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Tradezy has made buying and selling textbooks so much easier! The verification process makes me feel safe.",
      author: "Aisha Muhammad.",
      role: "Computer Science Student",
      avatar: "/lovable-uploads/3fdfaed5-4b18-4048-93dd-bea2e609ff26.png"
    },
    {
      quote: "I love how easy it is to find what I need. The direct messaging feature is super convenient!",
      author: "Fatima Buhari.",
      role: "Business Major",
      avatar: "/lovable-uploads/3fdfaed5-4b18-4048-93dd-bea2e609ff26.png"
    },
    {
      quote: "Best platform for campus trading! The community is great and prices are reasonable.",
      author: "Mohammed Salihu.",
      role: "Graduate Student",
      avatar: "/lovable-uploads/3fdfaed5-4b18-4048-93dd-bea2e609ff26.png"
    }
  ];
  
  return (
    <section className="py-24 bg-blue-950/30" id="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4 text-white">
              What <span className="bg-green-500 px-6 py-2 rounded-[15px] inline-block my-2">Students Say</span>
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Hear from our community of GSU students who use our platform daily.
            </p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              className="bg-white/5 p-8 rounded-xl border border-blue-200/10 backdrop-blur-sm hover:border-blue-200/20 transition-all duration-300 group relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.1)" 
              }}
            >
              {/* Decorative quote icon */}
              <div className="absolute -top-4 -left-4 text-blue-500/10 opacity-20">
                <Quote className="w-24 h-24" />
              </div>
              
              <div className="flex items-center mb-6">
                <div className="mr-4">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 overflow-hidden">
                    <motion.img 
                      src={testimonial.avatar} 
                      alt={testimonial.author} 
                      className="w-full h-full object-cover"
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.5 }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/200x200/2563eb/FFFFFF?text=Student";
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-blue-500">{testimonial.author}</div>
                  <div className="text-sm text-white/60">{testimonial.role}</div>
                </div>
              </div>
              
              <div className="mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="inline-block w-4 h-4 text-blue-500 fill-blue-500" />
                ))}
              </div>
              
              <motion.p 
                className="text-white/80 mb-4 relative z-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.3 }}
              >
                {testimonial.quote}
              </motion.p>
              
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-green-500"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.2 }}
                style={{ transformOrigin: "left" }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
