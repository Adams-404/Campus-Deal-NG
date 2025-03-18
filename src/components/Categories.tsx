"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Heart, Check, X, Pause, Play } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useSwipeable } from "react-swipeable"

type Tip = {
  id: string
  title: string
  content: string
  type: "do" | "dont"
}

const tips: Tip[] = [
  {
    id: "tip-1",
    title: "Do: Check Product Condition",
    content: "Always inspect items thoroughly before purchasing.",
    type: "do",
  },
  {
    id: "tip-2",
    title: "Don't: Share Personal Info",
    content: "Avoid sharing sensitive information with sellers.",
    type: "dont",
  },
  {
    id: "tip-3",
    title: "Do: Negotiate Prices",
    content: "Politely negotiate for better deals when appropriate.",
    type: "do",
  },
  {
    id: "tip-4",
    title: "Don't: Rush Transactions",
    content: "Take your time to make informed purchasing decisions.",
    type: "dont",
  },
  {
    id: "tip-5",
    title: "Do: Meet in Public Places",
    content: "For safety, always meet in well-lit, public areas for exchanges.",
    type: "do",
  },
  {
    id: "tip-6",
    title: "Don't: Pay Without Seeing",
    content: "Never pay for items before inspecting them in person.",
    type: "dont",
  },
  {
    id: "tip-7",
    title: "Do: Check Seller Reviews",
    content: "Review seller ratings and feedback before purchasing.",
    type: "do",
  },
  {
    id: "tip-8",
    title: "Don't: Ignore Red Flags",
    content: "Be cautious of deals that seem too good to be true.",
    type: "dont",
  },
  {
    id: "tip-9",
    title: "Do: Use Secure Payment",
    content: "Prefer secure payment methods for transactions.",
    type: "do",
  },
]

const TipCard = ({ tip, autoplay, isPaused, togglePause }: { tip: Tip, autoplay: boolean, isPaused: boolean, togglePause: (e: React.MouseEvent) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center space-y-4 min-h-[180px] w-full mx-0"
    >
      <div className="flex items-center gap-3">
        {tip.type === 'do' ? (
          <div className="p-2 bg-green-500/20 rounded-full">
            <Check className="w-6 h-6 text-green-500" />
          </div>
        ) : (
          <div className="p-2 bg-red-500/20 rounded-full">
            <X className="w-6 h-6 text-red-500" />
          </div>
        )}
        <h3 className={cn('text-xl md:text-2xl font-bold', tip.type === 'do' ? 'text-green-500' : 'text-red-500')}>
          {tip.title}
        </h3>
      </div>
      <p className="text-center text-gray-700 dark:text-gray-300 text-base md:text-lg max-w-prose">{tip.content}</p>
      <button
        onClick={togglePause}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {isPaused ? (
          <Play className="w-5 h-5" />
        ) : (
          <Pause className="w-5 h-5" />
        )}
      </button>
    </motion.div>
  );
};

export const Categories = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Set initial value
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Clean up
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % tips.length)
  }, [])

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + tips.length) % tips.length)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    // Reset autoplay timer when manually changing slides
    if (autoplay) {
      setIsPaused(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious()
      } else if (e.key === "ArrowRight") {
        handleNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleNext, handlePrevious])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (autoplay && !isPaused) {
      interval = setInterval(() => {
        handleNext()
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoplay, isPaused, handleNext])

  const toggleAutoplay = () => {
    if (!autoplay) {
      setAutoplay(true)
      setIsPaused(false)
    } else {
      setAutoplay(false)
    }
  }

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPaused(!isPaused)
  }

  const handlers = useSwipeable({
    onSwipedLeft: () => handleSwipe("left"),
    onSwipedRight: () => handleSwipe("right"),
  })

  const handleSwipe = (direction) => {
    if (direction === "left") {
      handleNext()
    } else if (direction === "right") {
      handlePrevious()
    }
  }

  const currentTip = tips[currentIndex]

  return (
    <section className="py-8 px-0 w-full" aria-labelledby="tips-heading">
      <div className="w-full mx-auto">
        <div className="flex flex-col gap-6 mb-8">
          <h2
            id="tips-heading"
            className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent text-center sm:text-left drop-shadow-md"
          >
            Safety Tips
          </h2>

          <div
            {...handlers}
            className="relative bg-transparent rounded-xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow border border-blue-500 md:pointer-events-none w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            role="region"
            aria-roledescription="carousel"
            aria-label="Safety tips carousel"
          >
            <div className="overflow-hidden">
              <AnimatePresence mode="wait">
                <TipCard
                  key={currentTip.id}
                  tip={currentTip}
                  autoplay={autoplay}
                  isPaused={isPaused}
                  togglePause={togglePause}
                />
              </AnimatePresence>
            </div>

            <div className="flex justify-center mt-6 gap-2 flex-wrap">
              {tips.map((tip, index) => (
                <button
                  key={tip.id}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all",
                    index === currentIndex
                      ? "bg-blue-500 w-6"
                      : "bg-gray-400/50 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600",
                  )}
                  aria-label={`Go to tip ${index + 1}: ${tip.title}`}
                  aria-current={index === currentIndex ? "true" : "false"}
                />
              ))}
            </div>

            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
              {!isMobile && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="h-9 w-9 rounded-full bg-blue-500/10 hover:bg-blue-500/20 shadow-md backdrop-blur-sm pointer-events-auto ml-2 sm:ml-4 flex items-center justify-center"
                    aria-label="Previous tip"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                    <span className="sr-only">Previous</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="h-9 w-9 rounded-full bg-blue-500/10 hover:bg-blue-500/20 shadow-md backdrop-blur-sm pointer-events-auto mr-2 sm:mr-4 flex items-center justify-center"
                    aria-label="Next tip"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                    <span className="sr-only">Next</span>
                  </button>
                </>
              )}
            </div>

            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {currentIndex + 1}/{tips.length}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Categories
