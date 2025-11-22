"use client"

import type React from "react"
import ReactMarkdown from "react-markdown"

import { PageTransition } from "@/components/PageTransition"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Bot, User, Loader2, Sparkles, MoreVertical, Copy, Check, MessageSquare, ExternalLink } from "lucide-react"
import { useNavigate, Link } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getAIResponse, type RichContentItem, type FormattedResults } from "@/services/ai-assistant"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  richContent?: FormattedResults
}

// Initial greeting from the AI
const INITIAL_MESSAGE: Message = {
  id: "1",
  content:
    "👋 Hi! I'm Tradie, your AI assistant for Campus Deal. I can help you with:\n\n• Using the marketplace\n• Account settings\n• Buying and selling\n• Safety tips\n• Technical support\n\nWhat can I help you with today?",
  role: "assistant",
  timestamp: new Date(),
}

export default function Support() {
  const navigate = useNavigate()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Message copied to clipboard")

    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isSubmitting) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage("")
    setIsSubmitting(true)
    setIsTyping(true)

    try {
      // Get user info for context
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Convert messages to format expected by AI service
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Get AI response
      const aiResponseContent = await getAIResponse(userMessage.content, chatHistory)
      
      let aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "",
        role: "assistant",
        timestamp: new Date(),
      };

      try {
        // Try to parse as JSON for rich content
        const parsedContent = JSON.parse(aiResponseContent);
        if (parsedContent && typeof parsedContent === 'object') {
          aiResponse.content = parsedContent.message || "Here's what I found:";
          aiResponse.richContent = parsedContent;
        } else {
          aiResponse.content = aiResponseContent;
        }
      } catch (e) {
        // If not JSON, use as plain text
        aiResponse.content = aiResponseContent;
      }

      setMessages((prev) => [...prev, aiResponse])
    } catch (error: any) {
      console.error("Error in Support component:", error)

      // Add the error message as an AI response
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I encountered an error: ${error.message || "Unknown error"}. Please try again or contact support if the issue persists.`,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
      toast.error(error.message || "Failed to get AI response. Please try again.")
    } finally {
      setIsSubmitting(false)
      setIsTyping(false)
    }
  }

  return (
    <div className="bg-background">
      {/* Header - Fixed */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 transition-all duration-300",
        isSidebarCollapsed ? "ml-0 lg:ml-[80px]" : "ml-0 lg:ml-[240px]"
      )}>
        <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="w-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="text-primary"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Go back</span>
              </Button>
            </div>
            <motion.div 
              className="flex flex-col items-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <motion.div 
                className="relative"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse"
                }}
              >
                <MessageSquare className="h-5 w-5 text-primary" />
                <motion.div
                  className="absolute -inset-1 rounded-full bg-primary/20"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
              <h1 className="text-lg font-semibold text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  Tradie
                </span>
              </h1>
              <p className="text-[10px] text-muted-foreground">Online • Typically replies instantly</p>
            </motion.div>
            <div className="w-10"></div> {/* Spacer for balance */}
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <PageTransition>
        {/* Main Chat Container - Fixed position and height */}
        <div className="fixed inset-0 pt-16 pb-0 lg:pl-[300px]">
          <div className="h-full w-full max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="h-[calc(100%-16px)] sm:h-[calc(100%-24px)] flex flex-col overflow-hidden"
            >
              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent [&:hover::-webkit-scrollbar-thumb]:bg-primary/10 [&::-webkit-scrollbar-track]:bg-transparent"
                id="messages"
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={cn("flex mb-2 sm:mb-4", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "flex items-start gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] group",
                          msg.role === "user" ? "flex-row-reverse" : "",
                        )}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-card border border-border/40 text-primary shadow",
                          )}
                        >
                          {msg.role === "user" ? (
                            <User className="h-4 w-4 sm:h-5 sm:w-5" />
                          ) : (
                            <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </motion.div>

                        <div
                          className={cn(
                            "relative p-3 sm:p-4 rounded-xl sm:rounded-2xl text-sm sm:text-base leading-relaxed transition-all duration-300 group",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg"
                              : "bg-card border border-border/40 text-foreground shadow hover:shadow-md",
                            "transform hover:scale-[1.01]",
                          )}
                        >
                          <div className="w-full">
                            <div className="whitespace-pre-wrap break-words font-normal prose prose-sm dark:prose-invert max-w-none prose-p:my-0.5 prose-ul:my-1 prose-li:my-0 leading-snug">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            {msg.richContent?.isRichContent && msg.richContent.richContent && (
                              <div className="mt-3 space-y-3">
                                {msg.richContent.richContent.map((item, idx) => (
                                  <div 
                                    key={`${msg.id}-item-${idx}`}
                                    className="border rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors"
                                  >
                                    <div className="flex gap-3 p-3">
                                      {item.image && (
                                        <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                                          <img 
                                            src={item.image} 
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground">₦{item.price.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                                        <p className="text-xs text-muted-foreground">Sold by: {item.sellerName}</p>
                                        <Button 
                                          asChild
                                          variant="outline" 
                                          size="sm" 
                                          className="mt-2 w-full bg-background/80 hover:bg-background/100 border-primary/20 hover:border-primary/40"
                                        >
                                          <Link to={`/item/${item.id}`} className="flex items-center gap-1">
                                            <span>View Item</span>
                                            <ExternalLink className="h-3.5 w-3.5" />
                                          </Link>
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                            <div
                              className={cn(
                                "text-[10px] sm:text-xs opacity-70",
                                msg.role === "user" ? "text-primary-foreground" : "text-muted-foreground",
                              )}
                            >
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>

                            <motion.button
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className={cn(
                                "ml-2 p-1 rounded-full",
                                msg.role === "user"
                                  ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                                  : "bg-background/50 text-muted-foreground hover:bg-background/80 hover:text-foreground",
                              )}
                            >
                              {copiedId === msg.id ? (
                                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              ) : (
                                <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              )}
                              <span className="sr-only">Copy message</span>
                            </motion.button>
                          </div>

                          {msg.role === "assistant" && (
                            <motion.div
                              className="absolute -inset-px rounded-xl sm:rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 -z-10 blur-sm"
                              animate={{
                                boxShadow: [
                                  "0 0 0px rgba(var(--primary), 0)",
                                  "0 0 20px rgba(var(--primary), 0.3)",
                                  "0 0 0px rgba(var(--primary), 0)",
                                ],
                              }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-card border border-border/40 text-primary flex items-center justify-center flex-shrink-0 shadow">
                          <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="bg-card border border-border/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow relative overflow-hidden">
                          <div className="flex gap-1 sm:gap-1.5 items-center h-5 sm:h-6">
                            <motion.span
                              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary/40"
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                            />
                            <motion.span
                              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary/60"
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                            />
                            <motion.span
                              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary/80"
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                            />
                          </div>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                            animate={{ x: [-100, 400] }}
                            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="p-2 sm:p-4 border-t border-border/40 bg-background/80 backdrop-blur-md"
              >
                <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 items-center">
                  <motion.div className="flex-1 relative" whileFocus={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <Input
                      ref={inputRef}
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 rounded-xl border-primary/20 focus:border-primary/40 bg-card/30 backdrop-blur-sm transition-all duration-300 placeholder:text-muted-foreground/60 text-sm sm:text-base py-5 sm:py-6 pr-10 sm:pr-12 shadow-sm focus:shadow-md focus:ring-2 focus:ring-primary/20"
                      disabled={isSubmitting}
                    />

                    {/* Animated send button that appears inside input when typing */}
                    <AnimatePresence>
                      {message.trim() && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2"
                        >
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-full w-7 h-7 sm:w-8 sm:h-8 p-0 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                          >
                            {isSubmitting ? (
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                            <span className="sr-only">Send message</span>
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Standalone send button that appears when input is empty */}
                  <AnimatePresence>
                    {!message.trim() && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          type="submit"
                          disabled={isSubmitting || !message.trim()}
                          className="rounded-xl px-4 sm:px-6 py-5 sm:py-6 transition-all duration-300 bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                          <span className="sr-only">Send message</span>
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </div>
  )
}

