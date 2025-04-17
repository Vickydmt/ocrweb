"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Pause, Play } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"

interface TextToSpeechProps {
  text: string
  language?: string
  compact?: boolean
}

export function TextToSpeech({ text, language = "en", compact = false }: TextToSpeechProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const { toast } = useToast()
  const { theme } = useTheme()

  // Map language codes to BCP 47 language tags for speech synthesis
  const languageMap: Record<string, string> = {
    en: "en-US",
    hi: "hi-IN",
    bn: "bn-IN",
    ta: "ta-IN",
    te: "te-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    pa: "pa-IN",
    ur: "ur-PK",
  }

  useEffect(() => {
    // Initialize speech synthesis utterance
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = languageMap[language] || "en-US"

      // Set voice (try to find a matching voice)
      const voices = window.speechSynthesis.getVoices()
      const matchingVoices = voices.filter((voice) =>
        voice.lang.startsWith(languageMap[language]?.split("-")[0] || "en"),
      )
      if (matchingVoices.length > 0) {
        utterance.voice = matchingVoices[0]
      }

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true)
        setIsPaused(false)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        setIsPaused(false)
      }

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event)
        setIsSpeaking(false)
        setIsPaused(false)
        toast({
          title: "Error",
          description: "There was an error with text-to-speech.",
          variant: "destructive",
        })
      }

      utteranceRef.current = utterance
    }

    // Clean up any ongoing speech when component unmounts
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [text, language, toast])

  const speakText = () => {
    if (!("speechSynthesis" in window)) {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      })
      return
    }

    // If already speaking, stop current speech
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
      return
    }

    // If paused, resume
    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      return
    }

    // Cancel any existing speech before starting new one
    window.speechSynthesis.cancel()

    // Start new speech
    if (utteranceRef.current) {
      window.speechSynthesis.speak(utteranceRef.current)
    }
  }

  const pauseText = () => {
    if ("speechSynthesis" in window && isSpeaking && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }

  const resumeText = () => {
    if ("speechSynthesis" in window && isSpeaking && isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }

  // Render compact version (just an icon button) if compact prop is true
  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={isSpeaking ? (isPaused ? resumeText : pauseText) : speakText}
        className={`h-8 w-8 rounded-full text-to-speech-button ${
          theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
        }`}
        title={isSpeaking ? (isPaused ? "Resume" : "Pause") : "Read aloud"}
      >
        {isSpeaking ? (
          isPaused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {isSpeaking ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={isPaused ? resumeText : pauseText}
            className={`flex items-center text-to-speech-button ${
              theme === "dark" ? "bg-gray-800 hover:bg-gray-700 border-gray-700" : ""
            }`}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={speakText}
            className={`flex items-center text-to-speech-button ${
              theme === "dark" ? "bg-gray-800 hover:bg-gray-700 border-gray-700" : ""
            }`}
            title="Stop"
          >
            <VolumeX className="h-4 w-4 mr-1" />
            Stop
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={speakText}
          className={`flex items-center text-to-speech-button ${
            theme === "dark" ? "bg-gray-800 hover:bg-gray-700 border-gray-700" : ""
          }`}
          title="Read aloud"
        >
          <Volume2 className="h-4 w-4 mr-1" />
          Read Aloud
        </Button>
      )}
    </div>
  )
}
