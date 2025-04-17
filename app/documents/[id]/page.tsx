"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getDocumentByIdAction, updateDocumentAction, deleteDocumentAction } from "@/lib/document-actions"
import { translateText } from "@/lib/translate"
import { ArrowLeft, Download, Languages, Loader2, Save, Trash2, BarChart, Sparkles, FileText } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DocumentStatistics } from "@/components/document-statistics"
import { AITextCorrection } from "@/components/ai-text-correction"
import { TextToSpeech } from "@/components/text-to-speech"
import ErrorBoundary from "@/components/error-boundary"
import { useTheme } from "next-themes"

interface Document {
  _id: string
  name: string
  type: string
  language: string
  content: string
  translatedContent?: string
  translationLanguage?: string
  pages: number
  confidence: number
  createdAt: string
  userId: string
  originalImage?: string
  processedImage?: string
  layout?: any[]
  structuredContent?: Record<string, string[]>
  metadata?: Record<string, any>
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    // Check if user is logged in
    const userLoggedIn =
      localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true"
    setIsLoggedIn(userLoggedIn)

    // Get user ID from localStorage or sessionStorage
    const userFromLocal = localStorage.getItem("user")
    const userFromSession = sessionStorage.getItem("user")
    const user = userFromLocal || userFromSession

    if (user) {
      const userData = JSON.parse(user)
      setUserId(userData.id)
    }
  }, [])

  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [translatedText, setTranslatedText] = useState("")
  const [targetLanguage, setTargetLanguage] = useState("en")
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAICorrection, setShowAICorrection] = useState(false)
  const [correctedText, setCorrectedText] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Update the useEffect that fetches the document
  useEffect(() => {
    const fetchDocument = async () => {
      if (!params.id) return

      try {
        setIsLoading(true)
        setError(null)

        const doc = await getDocumentByIdAction(params.id as string)
        if (!doc) {
          toast({
            title: "Document not found",
            description: "The requested document could not be found",
            variant: "destructive",
          })
          router.push("/documents")
          return
        }

        // Check if user has access to this document
        if (userId && doc.userId !== userId) {
          toast({
            title: "Access denied",
            description: "You don't have permission to view this document",
            variant: "destructive",
          })
          router.push("/documents")
          return
        }

        // Store document image in localStorage for persistence
        if (doc.originalImage) {
          try {
            localStorage.setItem(`doc-image-${doc._id}`, doc.originalImage)
          } catch (error) {
            console.error("Failed to store image in localStorage:", error)
          }
        }

        setDocument(doc)

        // If document has translated content, set it
        if (doc.translatedContent) {
          setTranslatedText(doc.translatedContent)
          setTargetLanguage(doc.translationLanguage || "en")
        }
      } catch (error) {
        console.error("Error fetching document:", error)
        setError("Failed to load document. Please try refreshing the page.")
        toast({
          title: "Failed to load document",
          description: "There was an error loading the document. Try refreshing the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoggedIn) {
      fetchDocument()
    } else {
      setIsLoading(false)
    }
  }, [params.id, router, toast, userId, isLoggedIn])

  const handleTranslate = async () => {
    if (!document) return

    try {
      setIsTranslating(true)

      // Add a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500))

      const translated = await translateText(document.content, targetLanguage, document.language)
      setTranslatedText(translated)

      // Save the translation to the document
      await updateDocumentAction(document._id, {
        translatedContent: translated,
        translationLanguage: targetLanguage,
      })

      toast({
        title: "Translation complete",
        description: `Document has been translated to ${getLanguageName(targetLanguage)}`,
      })
    } catch (error) {
      console.error("Translation error:", error)
      toast({
        title: "Translation failed",
        description: "There was an error translating the document",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
  }

  const handleSaveTranslation = async () => {
    if (!document || !translatedText) return

    try {
      setIsSaving(true)

      await updateDocumentAction(document._id, {
        translatedContent: translatedText,
        translationLanguage: targetLanguage,
      })

      toast({
        title: "Translation saved",
        description: "Your translation has been saved successfully",
      })

      // Update local document state
      setDocument({
        ...document,
        translatedContent: translatedText,
        translationLanguage: targetLanguage,
      })
    } catch (error) {
      console.error("Error saving translation:", error)
      toast({
        title: "Save failed",
        description: "There was an error saving the translation",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCorrectedText = async () => {
    if (!document || !correctedText) return

    try {
      setIsSaving(true)

      await updateDocumentAction(document._id, {
        content: correctedText,
      })

      toast({
        title: "Corrected text saved",
        description: "Your corrected text has been saved successfully",
      })

      // Update local document state
      setDocument({
        ...document,
        content: correctedText,
      })

      setShowAICorrection(false)
    } catch (error) {
      console.error("Error saving corrected text:", error)
      toast({
        title: "Save failed",
        description: "There was an error saving the corrected text",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Simplified downloadText function
  const downloadText = (text: string, filename: string) => {
    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `${filename}.txt`
      document.body.appendChild(a)
      a.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)

      toast({
        title: "Download started",
        description: "Your file is being downloaded",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading the file",
        variant: "destructive",
      })

      // Show text in an alert as a last resort
      alert(`${filename}:

${text.substring(0, 1000)}${text.length > 1000 ? "...(text truncated)" : ""}`)
    }
  }

  const handleDeleteDocument = async () => {
    if (!document) return

    try {
      setIsDeleting(true)

      await deleteDocumentAction(document._id)

      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted",
      })

      router.push("/documents")
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Delete failed",
        description: "There was an error deleting the document",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`container mx-auto py-10 px-4 ${theme === "dark" ? "text-white" : ""}`}>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <motion.div
        className={`container mx-auto py-10 px-4 ${theme === "dark" ? "text-white" : ""}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="mb-6">Please login to view document details</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild className={theme === "dark" ? "bg-gray-700 hover:bg-gray-600 text-white" : ""}>
              <Link href="/login">Login</Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  if (!document) {
    return (
      <motion.div
        className={`container mx-auto py-10 px-4 ${theme === "dark" ? "text-white" : ""}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Document Not Found</h2>
          <p className="mb-6">The document you're looking for doesn't exist or you don't have permission to view it.</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild className={theme === "dark" ? "bg-gray-700 hover:bg-gray-600 text-white" : ""}>
              <Link href="/documents">Back to Documents</Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className={`container mx-auto py-10 px-4 ${theme === "dark" ? "text-white" : ""}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Error Loading Document</h2>
          <p className="mb-6">{error}</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <ErrorBoundary>
      <AnimatePresence>
        <motion.div
          className={`container mx-auto py-10 px-4 ${theme === "dark" ? "text-white" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-5xl mx-auto">
            <motion.div
              className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2 document-detail-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className={`mr-4 ${theme === "dark" ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : ""}`}
                  >
                    <Link href="/documents">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Documents
                    </Link>
                  </Button>
                </motion.div>
                <h1 className="text-2xl font-bold">{document.name}</h1>
              </div>

              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAICorrection(!showAICorrection)}
                    className={
                      theme === "dark"
                        ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                        : "bg-gray-200 border-gray-300 hover:bg-gray-300"
                    }
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {showAICorrection ? "Hide AI Correction" : "AI Text Correction"}
                  </Button>
                </motion.div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`text-red-500 hover:text-red-700 ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-red-400"
                          : "hover:bg-red-50"
                      }`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className={theme === "dark" ? "bg-gray-800 border-gray-700" : ""}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the document "{document.name}" and
                        remove it from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className={theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : ""}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteDocument}
                        className="bg-red-500 hover:bg-red-600"
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>

            {showAICorrection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <AITextCorrection
                  originalText={document.content}
                  onCorrectedTextChange={setCorrectedText}
                  onClose={() => setShowAICorrection(false)}
                />

                {correctedText && (
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={handleSaveCorrectedText}
                      disabled={isSaving}
                      className={
                        theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-800 hover:bg-gray-700 text-white"
                      }
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Corrected Text
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <motion.div whileHover={{ scale: 1.03, rotateY: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className={theme === "dark" ? "bg-gray-800 border-gray-700" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Document Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="capitalize">{document.type}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03, rotateY: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className={theme === "dark" ? "bg-gray-800 border-gray-700" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Language</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{getLanguageName(document.language)}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03, rotateY: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className={theme === "dark" ? "bg-gray-800 border-gray-700" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">OCR Quality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{getQualityLabel(document.confidence)}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03, rotateY: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className={theme === "dark" ? "bg-gray-800 border-gray-700" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{document.pages}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Tabs defaultValue="text" className="w-full">
                <TabsList className={`mb-6 ${theme === "dark" ? "bg-gray-700" : ""}`}>
                  <TabsTrigger value="text" className={theme === "dark" ? "data-[state=active]:bg-gray-800" : ""}>
                    <FileText className="h-4 w-4 mr-2" />
                    Extracted Text
                  </TabsTrigger>
                  <TabsTrigger value="translate" className={theme === "dark" ? "data-[state=active]:bg-gray-800" : ""}>
                    <Languages className="h-4 w-4 mr-2" />
                    Translate
                  </TabsTrigger>
                  <TabsTrigger value="stats" className={theme === "dark" ? "data-[state=active]:bg-gray-800" : ""}>
                    <BarChart className="h-4 w-4 mr-2" />
                    Statistics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text">
                  <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Card className={theme === "dark" ? "bg-gray-800 border-gray-700" : ""}>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <CardTitle>Extracted Text</CardTitle>
                          <div className="flex items-center gap-2">
                            <TextToSpeech text={document.content} language={document.language} />
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadText(document.content, document.name)}
                                className={theme === "dark" ? "bg-gray-700 hover:bg-gray-600 border-gray-600" : ""}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={document.content}
                          readOnly
                          className={`min-h-[400px] font-mono text-sm ${
                            theme === "dark" ? "bg-gray-700 border-gray-600" : ""
                          }`}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="translate">
                  <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Card className={theme === "dark" ? "bg-gray-800 border-gray-700" : ""}>
                      <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <CardTitle>Translate Document</CardTitle>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                              <SelectTrigger
                                className={`w-full sm:w-[180px] ${
                                  theme === "dark" ? "bg-gray-700 border-gray-600" : ""
                                }`}
                              >
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent
                                position="popper"
                                className={`w-full min-w-[180px] ${theme === "dark" ? "bg-gray-700 border-gray-600" : ""}`}
                                sideOffset={5}
                              >
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="hi">Hindi</SelectItem>
                                <SelectItem value="bn">Bengali</SelectItem>
                                <SelectItem value="ta">Tamil</SelectItem>
                                <SelectItem value="te">Telugu</SelectItem>
                                <SelectItem value="mr">Marathi</SelectItem>
                                <SelectItem value="gu">Gujarati</SelectItem>
                                <SelectItem value="kn">Kannada</SelectItem>
                                <SelectItem value="ml">Malayalam</SelectItem>
                                <SelectItem value="pa">Punjabi</SelectItem>
                                <SelectItem value="ur">Urdu</SelectItem>
                              </SelectContent>
                            </Select>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-full sm:w-auto"
                            >
                              <Button
                                onClick={handleTranslate}
                                disabled={isTranslating}
                                className={`w-full sm:w-auto ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
                              >
                                {isTranslating ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Translating...
                                  </>
                                ) : (
                                  <>
                                    <Languages className="h-4 w-4 mr-2" />
                                    Translate
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 translation-container">
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium">Original ({getLanguageName(document.language)})</h3>
                            <Textarea
                              value={document.content}
                              readOnly
                              className={`min-h-[400px] font-mono text-sm ${
                                theme === "dark" ? "bg-gray-700 border-gray-600" : ""
                              }`}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h3 className="text-sm font-medium">Translation ({getLanguageName(targetLanguage)})</h3>
                              <TextToSpeech text={translatedText} language={targetLanguage} compact={true} />
                            </div>
                            <Textarea
                              value={translatedText}
                              readOnly
                              className={`min-h-[400px] font-mono text-sm ${
                                theme === "dark" ? "bg-gray-700 border-gray-600" : ""
                              }`}
                              placeholder={
                                isTranslating ? "Translating..." : "Click 'Translate' to see the translation"
                              }
                            />
                          </div>
                        </div>

                        {translatedText && (
                          <div className="flex flex-col sm:flex-row justify-end mt-4 gap-2 document-actions">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                onClick={() => downloadText(translatedText, `${document.name}-translated`)}
                                className={`w-full sm:w-auto ${
                                  theme === "dark" ? "bg-gray-700 hover:bg-gray-600 border-gray-600" : ""
                                }`}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Translation
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                onClick={handleSaveTranslation}
                                disabled={isSaving}
                                className={`w-full sm:w-auto ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Translation
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="stats">
                  <DocumentStatistics content={document.content} language={document.language} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </ErrorBoundary>
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
