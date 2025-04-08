
import { motion } from "framer-motion";
import { Star } from "lucide-react";

export const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Tradezy has made buying and selling textbooks so much easier! The verification process makes me feel safe.",
      author: "Aisha M.",
      role: "Computer Science Student"
    },
    {
      quote: "I love how easy it is to find what I need. The direct messaging feature is super convenient!",
      author: "Fatima B.",
      role: "Business Major"
    },
    {
      quote: "Best platform for campus trading! The community is great and prices are reasonable.",
      author: "Mohammed S.",
      role: "Graduate Student"
    }
  ];
  
  return (
    <section className="py-24 bg-blue-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-white">
            What <span className="bg-green-500 px-6 py-2 rounded-[15px] inline-block my-2">Students Say</span>
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Hear from our community of GSU students who use our platform daily.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              className="bg-white/5 p-6 rounded-xl border border-blue-200/10 backdrop-blur-sm hover:border-blue-200/20 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="inline-block w-4 h-4 text-blue-500 fill-blue-500" />
                ))}
              </div>
              <p className="text-white/80 mb-4">{testimonial.quote}</p>
              <div>
                <div className="font-semibold text-blue-500">{testimonial.author}</div>
                <div className="text-sm text-white/60">{testimonial.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
