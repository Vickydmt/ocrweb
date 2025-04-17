"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Mic, MicOff, Send, User, X, FileText, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// Define message interface for chat
interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

// Define quick suggestion interface
interface QuickSuggestion {
  text: string
  action: () => void
  icon?: React.ReactNode
}

// Predefined responses for common questions
const PREDEFINED_RESPONSES: Record<string, string> = {
  hello: "Hello! How can I assist you with document digitization today?",
  hi: "Hi there! How can I help you with your documents?",
  "how are you": "I'm functioning well, thank you! How can I assist with document digitization?",
  "what can you do":
    "I can help you with information about our OCR technology, document processing, translation features, and guide you through using our platform. I can also perform actions like logging in, navigating to pages, and opening documents for you.",
  ocr: "Our OCR (Optical Character Recognition) technology can extract text from various document types, including handwritten historical documents. We support multiple languages and provide high accuracy results.",
  languages:
    "DocuDigitize supports translation between multiple languages including English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Urdu.",
  translate:
    "You can translate your extracted document text to multiple languages. After processing your document, go to the 'Translate' tab to select your target language.",
  "document types":
    "We support various document types including historical manuscripts, birth certificates, marriage certificates, property deeds, legal contracts, letters, and general certificates.",
  pricing:
    "DocuDigitize offers a free tier with basic features and premium plans starting at $9.99/month for advanced features like batch processing and priority support.",
  "thank you": "You're welcome! Is there anything else I can help you with?",
  thanks: "You're welcome! Is there anything else I can help you with?",
  "how it works":
    "DocuDigitize works by uploading your document, processing it with our advanced OCR technology, and then providing you with editable, searchable text. You can also translate the extracted text to different languages.",
  help: "I'd be happy to help! You can ask me about OCR technology, document processing, supported languages, or how to use specific features of our platform. I can also perform actions like logging in, navigating to pages, and opening documents for you.",
}

// Document actions that the assistant can perform
interface DocumentAction {
  id: string
  title: string
  action: () => void
}

export function UnifiedAssistant() {
  // State for assistant mode and visibility
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [mode, setMode] = useState<"voice" | "chat">("voice") // Set voice as default
  const [showToggle, setShowToggle] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  // Voice recognition states
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [showTranscript, setShowTranscript] = useState(false)
  const recognitionRef = useRef<any>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Chat states
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your DocuDigitize assistant. How can I help you with your document digitization today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [quickSuggestions, setQuickSuggestions] = useState<QuickSuggestion[]>([])

  // Document actions state
  const [availableDocuments, setAvailableDocuments] = useState<DocumentAction[]>([])
  const [isPerformingAction, setIsPerformingAction] = useState(false)

  // Add this new state for auto-close timer
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null)

  const router = useRouter()
  const { toast } = useToast()
  const { theme } = useTheme()

  // Prevent scrolling when assistant is open
  useEffect(() => {
    if (isAssistantOpen && mode === "chat") {
      document.body.classList.add("no-scroll")
    } else {
      document.body.classList.remove("no-scroll")
    }

    return () => {
      document.body.classList.remove("no-scroll")
    }
  }, [isAssistantOpen, mode])

  // Show toggle button when assistant is open
  useEffect(() => {
    if (isAssistantOpen) {
      // Show toggle button with a slight delay
      const timer = setTimeout(() => {
        setShowToggle(true)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setShowToggle(false)
    }
  }, [isAssistantOpen])

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Initialize quick suggestions when assistant opens in chat mode
  useEffect(() => {
    if (isAssistantOpen && mode === "chat") {
      initializeQuickSuggestions()
    }
  }, [isAssistantOpen, mode])

  // Fetch available documents on mount
  useEffect(() => {
    // This would normally fetch from an API
    // For now, we'll use mock data
    const mockDocuments: DocumentAction[] = [
      {
        id: "doc1",
        title: "Historical Manuscript",
        action: () => router.push("/documents/doc1"),
      },
      {
        id: "doc2",
        title: "Birth Certificate",
        action: () => router.push("/documents/doc2"),
      },
      {
        id: "doc3",
        title: "Property Deed",
        action: () => router.push("/documents/doc3"),
      },
    ]

    setAvailableDocuments(mockDocuments)
  }, [router])

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      console.error("Speech recognition not supported in this browser")
      return
    }

    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = "en-US"

    // Initialize speech synthesis
    if ("speechSynthesis" in window) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance()
      speechSynthesisRef.current.rate = 1.0
      speechSynthesisRef.current.pitch = 1.0
    }

    // Set up event handlers
    recognitionRef.current.onstart = () => {
      setIsListening(true)
      setShowTranscript(true)
      setTranscript("Listening...")

      // Clear any existing timeout
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current)
        transcriptTimeoutRef.current = null
      }
    }

    recognitionRef.current.onresult = (event: any) => {
      // Get the latest result
      const latest = event.results[event.results.length - 1]
      const text = latest[0].transcript

      // Update transcript with interim results
      setTranscript(text)

      // Only process command when result is final
      if (latest.isFinal) {
        processVoiceCommand(text)
      }
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error)
      setIsListening(false)
      setTranscript("Error: " + event.error)

      toast({
        title: "Voice Recognition Error",
        description: "There was a problem with voice recognition. Please try again.",
        variant: "destructive",
      })

      // Set timeout to hide transcript
      transcriptTimeoutRef.current = setTimeout(() => {
        setShowTranscript(false)
      }, 5000)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)

      // Set timeout to hide transcript after 15 seconds
      transcriptTimeoutRef.current = setTimeout(() => {
        setShowTranscript(false)
      }, 15000)
    }

    return () => {
      // Clean up
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current)
      }
    }
  }, [toast])

  // Initialize quick suggestions
  const initializeQuickSuggestions = () => {
    const suggestions: QuickSuggestion[] = [
      {
        text: "Upload Document",
        action: () => {
          handleQuickSuggestion("Upload Document")
          router.push("/upload")
        },
        icon: <FileText className="h-4 w-4" />,
      },
      {
        text: "Login as Test User",
        action: () => {
          handleQuickSuggestion("Login as Test User")
          performLogin("test@example.com", "password123")
        },
        icon: <LogIn className="h-4 w-4" />,
      },
      {
        text: "Open First Document",
        action: () => {
          if (availableDocuments.length > 0) {
            handleQuickSuggestion("Open First Document")
            availableDocuments[0].action()
          } else {
            handleQuickSuggestion("Open First Document")
            addAssistantMessage("No documents found. Please upload a document first.")
          }
        },
        icon: <FileText className="h-4 w-4" />,
      },
    ]

    setQuickSuggestions(suggestions)
  }

  // Toggle assistant visibility
  const toggleAssistant = () => {
    if (isToggling) return // Prevent opening while toggling modes

    if (isAssistantOpen) {
      // Close assistant
      setIsAssistantOpen(false)

      // Stop listening if in voice mode
      if (mode === "voice" && isListening) {
        stopListening()
      }

      // Clear any existing auto-close timer
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer)
        setAutoCloseTimer(null)
      }
    } else {
      // Open assistant
      setIsAssistantOpen(true)

      // Start listening if in voice mode
      if (mode === "voice") {
        startListening()
      }

      // Set auto-close timer (30 seconds of inactivity)
      const timer = setTimeout(() => {
        if (!isListening && mode === "voice") {
          setIsAssistantOpen(false)
        }
      }, 30000)

      setAutoCloseTimer(timer)
    }
  }

  // Toggle between voice and chat modes
  const toggleMode = () => {
    setIsToggling(true)

    // If currently in voice mode and listening, stop listening
    if (mode === "voice" && isListening) {
      stopListening()
    }

    // Toggle mode
    setMode(mode === "voice" ? "chat" : "voice")

    // Reset toggling state after a short delay
    setTimeout(() => {
      setIsToggling(false)
    }, 300)
  }

  // Start listening for voice commands
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        // Cancel any ongoing speech before starting to listen
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel()
        }

        // Stop and restart recognition to fix multiple click issues
        recognitionRef.current.abort()
        setTimeout(() => {
          recognitionRef.current.start()
        }, 100)
      } catch (error) {
        console.error("Error starting speech recognition:", error)
        toast({
          title: "Voice Recognition Error",
          description: "There was a problem starting voice recognition. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Stop listening for voice commands
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.abort()
    }
  }

  // Process voice commands
  const processVoiceCommand = (command: string) => {
    // Reset auto-close timer when processing a command
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer)

      const timer = setTimeout(() => {
        if (!isListening && mode === "voice") {
          setIsAssistantOpen(false)
        }
      }, 30000)

      setAutoCloseTimer(timer)
    }

    const lowerCommand = command.toLowerCase().trim()
    let responseText = ""

    // Login command
    if (lowerCommand.includes("login") || lowerCommand.includes("sign in")) {
      if (lowerCommand.includes("test user") || lowerCommand.includes("test account")) {
        responseText = "Logging in with test user account"
        performLogin("test@example.com", "password123")
      } else {
        responseText = "Taking you to the login page"
        router.push("/login")
      }
    }
    // Navigation commands
    else if (lowerCommand.includes("go to document") || lowerCommand.includes("open document")) {
      if (lowerCommand.includes("first") || lowerCommand.includes("1")) {
        if (availableDocuments.length > 0) {
          responseText = `Opening the first document: ${availableDocuments[0].title}`
          availableDocuments[0].action()
        } else {
          responseText = "No documents found. Please upload a document first."
        }
      } else {
        responseText = "Opening documents page"
        router.push("/documents")
      }
    } else if (lowerCommand.includes("go to upload") || lowerCommand.includes("open upload")) {
      responseText = "Opening upload page"
      router.push("/upload")
    } else if (lowerCommand.includes("go to dashboard") || lowerCommand.includes("open dashboard")) {
      responseText = "Opening dashboard"
      router.push("/dashboard")
    } else if (lowerCommand.includes("go to setting") || lowerCommand.includes("open setting")) {
      responseText = "Opening settings"
      router.push("/settings")
    } else if (lowerCommand.includes("go to about") || lowerCommand.includes("open about")) {
      responseText = "Opening about page"
      router.push("/about")
    } else if (lowerCommand.includes("go to contact") || lowerCommand.includes("open contact")) {
      responseText = "Opening contact page"
      router.push("/contact")
    } else if (lowerCommand.includes("go to faq") || lowerCommand.includes("open faq")) {
      responseText = "Opening FAQ page"
      router.push("/faq")
    } else if (lowerCommand.includes("go to home") || lowerCommand.includes("open home")) {
      responseText = "Going to home page"
      router.push("/")
    }
    // Chart and statistics commands
    else if (lowerCommand.includes("show chart") || lowerCommand.includes("display chart")) {
      responseText = "Showing document statistics chart"
      router.push("/dashboard?showChart=true")
    } else if (lowerCommand.includes("show statistics") || lowerCommand.includes("display statistics")) {
      responseText = "Showing document statistics"
      router.push("/dashboard?showStats=true")
    }
    // Document actions
    else if (lowerCommand.includes("upload document") || lowerCommand.includes("upload a document")) {
      responseText = "Taking you to upload page"
      router.push("/upload")
    } else if (lowerCommand.includes("translate document") || lowerCommand.includes("translate a document")) {
      responseText = "Taking you to documents page"
      router.push("/documents")
    } else if (lowerCommand.includes("logout") || lowerCommand.includes("sign out")) {
      responseText = "Signing you out"
      localStorage.setItem("isLoggedIn", "false")
      localStorage.removeItem("user")
      window.dispatchEvent(new Event("auth-change"))
      router.push("/login")
    }
    // Switch to chat mode
    else if (lowerCommand.includes("chat mode") || lowerCommand.includes("switch to chat")) {
      responseText = "Switching to chat mode"
      setMode("chat")
    }
    // General questions
    else if (
      lowerCommand.includes("what is") ||
      lowerCommand.includes("how does") ||
      lowerCommand.includes("tell me about")
    ) {
      if (lowerCommand.includes("ocr") || lowerCommand.includes("optical character recognition")) {
        responseText =
          "OCR or Optical Character Recognition is technology that converts images of text into machine-readable text. Our platform uses advanced OCR to digitize historical documents."
      } else if (lowerCommand.includes("document digitization")) {
        responseText =
          "Document digitization is the process of converting physical documents into digital formats. Our platform specializes in historical document digitization with OCR and multilingual support."
      } else {
        responseText =
          "I'm your document assistant. I can help you navigate the platform, upload documents, and answer questions about document digitization."
      }
    }
    // Fallback
    else {
      responseText = "Sorry, I didn't understand that command. Try saying 'go to documents' or 'upload document'."
    }

    // Set response and speak it
    speakResponse(responseText)
  }

  // Perform login action
  const performLogin = (email: string, password: string) => {
    setIsPerformingAction(true)

    // Simulate login process
    setTimeout(() => {
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("user", JSON.stringify({ email, name: "Test User" }))
      window.dispatchEvent(new Event("auth-change"))

      toast({
        title: "Login Successful",
        description: "You are now logged in as Test User",
      })

      router.push("/dashboard")
      setIsPerformingAction(false)
    }, 1500)
  }

  // Speak response using speech synthesis
  const speakResponse = (text: string) => {
    if ("speechSynthesis" in window && speechSynthesisRef.current) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      // Set new text and speak
      speechSynthesisRef.current.text = text
      window.speechSynthesis.speak(speechSynthesisRef.current)
    }
  }

  // Add assistant message to chat
  const addAssistantMessage = (content: string) => {
    const assistantMessage: Message = {
      role: "assistant",
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])
  }

  // Handle quick suggestion click
  const handleQuickSuggestion = (text: string) => {
    // Add user message
    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
  }

  // Send chat message
  const sendChatMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Process the command as if it were a voice command
      processAdvancedChatCommand(input)

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate response using pattern matching
      const response = generateChatResponse(input)

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)

      // Fallback response
      const assistantMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I'm having trouble processing your request. Please try again later.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Process advanced chat commands (same as voice commands but for chat)
  const processAdvancedChatCommand = (command: string) => {
    const lowerCommand = command.toLowerCase().trim()

    // Login command
    if (lowerCommand.includes("login with test user") || lowerCommand.includes("login as test user")) {
      performLogin("test@example.com", "password123")
    }
    // Navigation commands
    else if (lowerCommand.includes("go to documents") || lowerCommand.includes("open documents")) {
      router.push("/documents")
    } else if (lowerCommand.includes("open first document") || lowerCommand.includes("select first document")) {
      if (availableDocuments.length > 0) {
        availableDocuments[0].action()
      }
    } else if (lowerCommand.includes("go to upload") || lowerCommand.includes("open upload")) {
      router.push("/upload")
    } else if (lowerCommand.includes("go to dashboard") || lowerCommand.includes("open dashboard")) {
      router.push("/dashboard")
    } else if (lowerCommand.includes("go to settings") || lowerCommand.includes("open settings")) {
      router.push("/settings")
    } else if (lowerCommand.includes("show chart") || lowerCommand.includes("display chart")) {
      router.push("/dashboard?showChart=true")
    } else if (lowerCommand.includes("logout") || lowerCommand.includes("sign out")) {
      localStorage.setItem("isLoggedIn", "false")
      localStorage.removeItem("user")
      window.dispatchEvent(new Event("auth-change"))
      router.push("/login")
    }
  }

  // Generate chat response
  const generateChatResponse = (userInput: string): string => {
    const lowercaseInput = userInput.toLowerCase()

    // Check for exact matches in predefined responses
    for (const [key, response] of Object.entries(PREDEFINED_RESPONSES)) {
      if (lowercaseInput.includes(key)) {
        return response
      }
    }

    // Pattern matching for more complex queries
    if (lowercaseInput.includes("upload") && lowercaseInput.includes("document")) {
      return "To upload a document, go to the Upload page and either drag and drop your file or click to browse. We support JPG, PNG, and PDF formats."
    }

    if (lowercaseInput.includes("process") || lowercaseInput.includes("extract")) {
      return "Our document processing uses advanced OCR technology to extract text from your documents. After uploading, you can enhance the image, select the language, and adjust settings for optimal results."
    }

    if (lowercaseInput.includes("account") || lowercaseInput.includes("register") || lowercaseInput.includes("login")) {
      return "You can create an account by clicking the Register button in the top right corner. If you already have an account, click Login. Your documents will be saved to your account for future access."
    }

    if (lowercaseInput.includes("download") || lowercaseInput.includes("export")) {
      return "After processing your document, you can download the extracted text as a plain text file. If you've translated the document, you can download the translation as well."
    }

    if (
      lowercaseInput.includes("grammar") ||
      lowercaseInput.includes("spelling") ||
      lowercaseInput.includes("correct")
    ) {
      return "Our text correction feature uses advanced NLP technology to check your document for grammar, spelling, and style issues. After processing your document, go to the 'Correct' tab to improve your text quality."
    }

    if (lowercaseInput.includes("chart") || lowercaseInput.includes("statistics")) {
      return "You can view document statistics and charts on the Dashboard page. These visualizations show your document processing history, accuracy rates, and other useful metrics."
    }

    // Voice mode command
    if (lowercaseInput.includes("voice mode") || lowercaseInput.includes("switch to voice")) {
      setMode("voice")
      return "Switching to voice mode. You can now speak commands."
    }

    // Default response for unrecognized queries
    return "I'm not sure I understand your question. Could you please rephrase? I can help with information about OCR, document processing, translation, account management, and using our platform."
  }

  // Handle Enter key press in chat input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }

  // Add this effect to reset the auto-close timer when there's activity
  useEffect(() => {
    // Clear existing timer when there's activity
    if (autoCloseTimer && isAssistantOpen) {
      clearTimeout(autoCloseTimer)

      // Set a new timer
      const timer = setTimeout(() => {
        if (!isListening && mode === "voice") {
          setIsAssistantOpen(false)
        }
      }, 30000)

      setAutoCloseTimer(timer)
    }

    // Clean up on unmount
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer)
      }
    }
  }, [transcript, messages, isListening])

  return (
    <>
      {/* Assistant buttons container */}
      <div className="fixed bottom-6 right-6 flex items-center space-x-2 z-50">
        {/* Mode toggle button - always visible next to main button */}
        {showToggle && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={toggleMode}
            className={`assistant-toggle ${
              theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-800"
            } hover:bg-gray-700 hover:text-white shadow-lg p-3 rounded-full`}
          >
            {mode === "voice" ? <Bot className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </motion.button>
        )}

        {/* Main assistant button */}
        <motion.button
          onClick={toggleAssistant}
          className={`assistant-button ${
            theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-800"
          } hover:bg-gray-700 hover:text-white p-3 rounded-full shadow-lg`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {mode === "voice" ? (
            isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )
          ) : (
            <Bot className="h-6 w-6" />
          )}
        </motion.button>
      </div>

      {/* Voice transcript bubble */}
      <AnimatePresence>
        {mode === "voice" && showTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 max-w-xs bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50"
          >
            <div className="text-sm font-medium mb-1">{isListening ? "Listening..." : "I heard:"}</div>
            <div className="text-base">{transcript}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat interface */}
      <AnimatePresence>
        {mode === "chat" && isAssistantOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <Card className="shadow-xl backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 h-[500px] w-[350px] flex flex-col">
              <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white">
                <CardTitle className="text-base font-medium flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  DocuDigitize Assistant
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-600 hover:bg-gray-300 dark:text-gray-200 dark:hover:bg-gray-600"
                  onClick={() => setIsAssistantOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-4 overflow-y-auto flex-grow">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`rounded-lg px-3 py-2 max-w-[80%] ${
                          message.role === "assistant"
                            ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
                            : "bg-gray-800 text-white dark:bg-gray-600"
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          {message.role === "assistant" ? (
                            <Bot className="h-3 w-3 mr-1" />
                          ) : (
                            <User className="h-3 w-3 mr-1" />
                          )}
                          <span className="text-xs opacity-70">
                            {message.role === "assistant" ? "Assistant" : "You"} •{" "}
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="rounded-lg px-3 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white">
                        <div className="flex items-center mb-1">
                          <Bot className="h-3 w-3 mr-1" />
                          <span className="text-xs opacity-70">
                            Assistant • {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <div
                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce dark:bg-gray-400"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce dark:bg-gray-400"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce dark:bg-gray-400"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {isPerformingAction && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center"
                    >
                      <div className="rounded-lg px-3 py-2 bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                          <span className="text-sm">Performing action...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Quick suggestions */}
              {quickSuggestions.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick actions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={suggestion.action}
                        className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-xs"
                      >
                        {suggestion.icon}
                        <span>{suggestion.text}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <CardFooter className="p-4 pt-0 border-t">
                <div className="flex w-full items-center space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-gray-100 dark:bg-gray-700"
                  />
                  <Button
                    size="icon"
                    onClick={sendChatMessage}
                    disabled={isLoading || !input.trim()}
                    className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
