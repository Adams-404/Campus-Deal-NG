
import { motion } from "framer-motion";
import { Bot, MessageCircle, Clock, Zap, Check } from "lucide-react"; // Changed Robot to Bot
import { useState } from "react";

export const AiAssistantSection = () => {
  const [activeMessage, setActiveMessage] = useState(0);
  
  const messages = [
    {
      question: "How do I list an item for sale?",
      answer: "To list an item, tap the + button at the bottom of your screen, then 'Sell an Item'. Upload clear photos and fill out all details for better visibility!"
    },
    {
      question: "Is it safe to meet buyers on campus?",
      answer: "Yes, but always meet in public places like the Student Union or library. We recommend using our in-app messaging to arrange details and avoid sharing personal contact information."
    },
    {
      question: "How can I report a suspicious user?",
      answer: "Visit their profile, tap the three dots in the top right corner, then select 'Report User'. Our team will review your report within 24 hours."
    }
  ];

  const features = [
    {
      icon: MessageCircle,
      title: "Instant Answers",
      description: "Get immediate responses to your questions without waiting for customer support"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Campus Assistant is always available to help, day or night, weekends and holidays"
    },
    {
      icon: Zap,
      title: "Smart Suggestions",
      description: "Receive personalized recommendations based on your trading activity"
    }
  ];

  return (
    <section className="py-12 lg:py-20 xl:py-24 relative" id="ai-assistant">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 to-black/50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10">
        <div className="text-center mb-8 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-white">
              Meet <span className="bg-purple-600 px-4 sm:px-5 py-1 sm:py-1.5 rounded-xl inline-block my-1 text-lg sm:text-xl lg:text-2xl">Campus Assistant</span>
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Your AI assistant that provides instant help and guidance, so you never have to wait for customer service
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-16 items-start">
          {/* Demo chat interface */}
          <motion.div
            className="w-full bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden shadow-lg order-2 lg:order-1"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="bg-purple-900/30 p-4 flex items-center gap-3 border-b border-purple-500/20">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" /> {/* Changed Robot to Bot */}
              </div>
              <div>
                <h3 className="font-medium text-white">Campus Assistant</h3>
                <p className="text-xs text-white/60">AI Assistant • Always Online</p>
              </div>
              <div className="ml-auto flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-xs text-green-500">Online</span>
              </div>
            </div>
            
            <div className="p-4 sm:p-5 lg:p-6 h-[350px] sm:h-[380px] lg:h-[420px] flex flex-col overflow-hidden">
              <div className="flex-grow space-y-3 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-purple-700/50 scrollbar-track-transparent hover:scrollbar-thumb-purple-700/70">
                {/* Welcome message */}
                <div className="flex items-start gap-2 sm:gap-3 mb-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> {/* Changed Robot to Bot */}
                  </div>
                  <div className="bg-purple-900/30 rounded-lg rounded-tl-none p-2 sm:p-3 max-w-[85%]">
                    <p className="text-white text-sm sm:text-base">Hi there! I'm Campus Assistant, your personal AI assistant for Campus Deal. How can I help you today?</p>
                  </div>
                </div>
                
                {/* Demo conversation */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  {messages.map((message, index) => (
                    <motion.div 
                      key={index} 
                      className={`${index > activeMessage ? "opacity-0 h-0 overflow-hidden" : "opacity-100"}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ 
                        opacity: index <= activeMessage ? 1 : 0,
                        height: index <= activeMessage ? "auto" : 0
                      }}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                    >
                      {/* User question */}
                      <div className="flex items-start gap-2 sm:gap-3 justify-end mb-2">
                        <div className="bg-blue-600/30 rounded-lg rounded-tr-none p-2 sm:p-2.5 max-w-[85%] sm:max-w-[90%]">
                          <p className="text-white text-sm sm:text-[15px] leading-snug">{message.question}</p>
                        </div>
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">Me</span>
                        </div>
                      </div>
                      
                      {/* AI response */}
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <div className="bg-purple-900/30 rounded-lg rounded-tl-none p-2 sm:p-2.5 max-w-[85%] sm:max-w-[90%]">
                          <p className="text-white text-sm sm:text-[15px] leading-snug">{message.answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Input field */}
              {activeMessage < messages.length && (
                <motion.div
                  className="mt-4 pt-4 border-t border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <button 
                    onClick={() => setActiveMessage(prev => Math.min(prev + 1, messages.length - 1))}
                    className="bg-white/10 hover:bg-white/20 transition-colors rounded-full w-full p-2 sm:p-3 text-white text-left flex justify-between items-center"
                  >
                    <span className="text-white/60 text-sm sm:text-base">Type your message...</span>
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
          
          {/* Features */}
          <motion.div
            className="space-y-7 lg:space-y-10 order-1 lg:order-2 mb-8 lg:mb-0 lg:pt-2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                className="flex flex-col sm:flex-row gap-3 sm:gap-5 lg:gap-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
              >
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-[15px] sm:text-lg font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-white/70 text-sm sm:text-[15px] leading-relaxed">{feature.description}</p>
                  <ul className="mt-2">
                    <li className="flex items-center gap-2 text-sm text-white/60">
                      <Check className="w-4 h-4 text-purple-500" />
                      <span>No waiting time</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            ))}

            <motion.div
              className="mt-8 p-4 border border-purple-500/20 rounded-lg bg-purple-900/10 text-sm sm:text-[15px] leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <p className="text-white/70 italic">
                "Campus Assistant uses advanced AI to understand your needs and provide relevant assistance for all your campus trading activities."
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
