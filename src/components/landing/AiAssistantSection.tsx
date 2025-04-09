
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
      description: "Tradie is always available to help, day or night, weekends and holidays"
    },
    {
      icon: Zap,
      title: "Smart Suggestions",
      description: "Receive personalized recommendations based on your trading activity"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden" id="ai-assistant">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 to-black/50" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4 text-white">
              Meet <span className="bg-purple-600 px-6 py-2 rounded-[15px] inline-block my-2">Tradie</span>
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Your AI assistant that provides instant help and guidance, so you never have to wait for customer service
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Demo chat interface */}
          <motion.div
            className="bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden shadow-lg"
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
                <h3 className="font-medium text-white">Tradie</h3>
                <p className="text-xs text-white/60">AI Assistant • Always Online</p>
              </div>
              <div className="ml-auto flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-xs text-green-500">Online</span>
              </div>
            </div>
            
            <div className="p-6 h-[400px] flex flex-col">
              <div className="flex-grow space-y-4 overflow-y-auto">
                {/* Welcome message */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" /> {/* Changed Robot to Bot */}
                  </div>
                  <div className="bg-purple-900/30 rounded-lg rounded-tl-none p-4 max-w-[85%]">
                    <p className="text-white">Hi there! I'm Tradie, your personal AI assistant for Tradezy. How can I help you today?</p>
                  </div>
                </div>
                
                {/* Demo conversation */}
                <div className="flex flex-col gap-6">
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
                      <div className="flex items-start gap-3 justify-end">
                        <div className="bg-blue-600/30 rounded-lg rounded-tr-none p-3 max-w-[85%]">
                          <p className="text-white">{message.question}</p>
                        </div>
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm">Me</span>
                        </div>
                      </div>
                      
                      {/* AI response */}
                      <div className="flex items-start gap-3 mt-4">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" /> {/* Changed Robot to Bot */}
                        </div>
                        <div className="bg-purple-900/30 rounded-lg rounded-tl-none p-3 max-w-[85%]">
                          <p className="text-white">{message.answer}</p>
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
                    className="bg-white/10 hover:bg-white/20 transition-colors rounded-full w-full p-3 text-white text-left flex justify-between items-center"
                  >
                    <span className="text-white/60">Type your message...</span>
                    <MessageCircle className="w-5 h-5 text-purple-500" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
          
          {/* Features */}
          <motion.div
            className="space-y-12"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                className="flex gap-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
              >
                <div className={`w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
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
              className="mt-8 p-4 border border-purple-500/20 rounded-lg bg-purple-900/10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <p className="text-white/70 italic">
                "Tradie uses advanced AI to understand your needs and provide relevant assistance for all your campus trading activities."
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
