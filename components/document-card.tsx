"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import type { Document } from "@/lib/mock-data-service"
import { useTheme } from "next-themes"

export function DocumentCard({ document, onDelete }: { document: Document; onDelete?: () => void }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    // Process and store document image URL
    if (document.originalImage) {
      // Store in localStorage and state
      localStorage.setItem(`doc-image-${document._id}`, document.originalImage)
      setThumbnailUrl(document.originalImage)
    } else {
      // Try to retrieve from localStorage if not available
      const storedImage = localStorage.getItem(`doc-image-${document._id}`)
      if (storedImage) {
        setThumbnailUrl(storedImage)
      } else {
        setThumbnailUrl("/placeholder.svg?height=200&width=200")
      }
    }
  }, [document._id, document.originalImage])

  const handleImageError = () => {
    // If image fails to load, replace with placeholder
    setThumbnailUrl("/placeholder.svg?height=200&width=200")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`overflow-hidden h-full flex flex-col ${theme === "dark" ? "bg-gray-800 border-gray-700" : ""}`}>
        <CardContent className="p-0">
          <div className="p-4">
            <h3 className="text-lg font-medium truncate mb-1">{document.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{new Date(document.createdAt).toLocaleDateString()}</p>

            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{document.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language:</span>
                <span className="font-medium">{getLanguageName(document.language)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pages:</span>
                <span className="font-medium">{document.pages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OCR Quality:</span>
                <span className="font-medium">{getQualityLabel(document.confidence)}</span>
              </div>
            </div>

            <Button
              variant="outline"
              className={`w-full ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600 border-gray-600" : ""}`}
              asChild
            >
              <Link href={`/documents/${document._id}`}>View Document</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function getLanguageName(languageCode: string): string {
  const languages: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    bn: "Bengali",
    ta: "Tamil",
    te: "Telugu",
    mr: "Marathi",
    gu: "Gujarati",
    kn: "Kannada",
    ml: "Malayalam",
    pa: "Punjabi",
    ur: "Urdu",
    auto: "Auto-detected",
  }

  return languages[languageCode] || languageCode
}

function getQualityLabel(confidence: number): string {
  if (confidence >= 90) return "High (90%+)"
  if (confidence >= 70) return "Medium (70-89%)"
  return "Low (<70%)"
}
