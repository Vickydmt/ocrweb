"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { getUserDocumentsAction } from "@/lib/document-actions"
import { FileText, Search, Calendar, Upload, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { DocumentCard } from "@/components/document-card"
import ErrorBoundary from "@/components/error-boundary"

interface Document {
  _id: string
  name: string
  type: string
  language: string
  createdAt: string
  pages: number
  confidence: number
  content: string
  originalImage?: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Check login status whenever the component mounts
  useEffect(() => {
    const checkLoginStatus = () => {
      try {
        const userLoggedIn = localStorage.getItem("isLoggedIn") === "true"
        setIsLoggedIn(userLoggedIn)

        // Get user ID from localStorage
        const user = localStorage.getItem("user")
        if (user) {
          const userData = JSON.parse(user)
          setUserId(userData.id)
        }
      } catch (err) {
        console.error("Error checking login status:", err)
        setError("Failed to check login status")
      } finally {
        setIsLoaded(true)
      }
    }

    checkLoginStatus()

    // Listen for auth changes
    window.addEventListener("auth-change", checkLoginStatus)
    return () => {
      window.removeEventListener("auth-change", checkLoginStatus)
    }
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDocuments(documents)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = documents.filter(
        (doc) => doc.name.toLowerCase().includes(query) || doc.type.toLowerCase().includes(query),
      )
      setFilteredDocuments(filtered)
    }
  }, [searchQuery, documents])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  // Add a useEffect to ensure the page loads properly
  useEffect(() => {
    // Force a re-render after component mounts to ensure proper loading
    const timer = setTimeout(() => {
      if (documents.length === 0 && !isLoading && userId) {
        // If documents are empty but we have a userId, try fetching again
        setIsLoading(true)
        getUserDocumentsAction(userId)
          .then((docs) => {
            setDocuments(docs)
            setFilteredDocuments(docs)
          })
          .catch((error) => {
            console.error("Error refreshing documents:", error)
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [documents.length, isLoading, userId])

  // Add this function to persist document images to localStorage
  const persistDocumentImages = (docs: Document[]) => {
    docs.forEach((doc) => {
      if (doc.originalImage) {
        localStorage.setItem(`doc-image-${doc._id}`, doc.originalImage)
      }
    })
  }

  // Fetch documents when userId is available
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        setError(null)
        const docs = await getUserDocumentsAction(userId)

        // Store document images in localStorage for persistence
        persistDocumentImages(docs)

        setDocuments(docs)
        setFilteredDocuments(docs)
      } catch (error) {
        console.error("Error fetching documents:", error)
        setError("Failed to load documents. Please try refreshing the page.")
        toast({
          title: "Failed to load documents",
          description: "There was an error loading your documents",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoaded && userId) {
      fetchDocuments()
    } else if (isLoaded) {
      setIsLoading(false)
    }
  }, [userId, isLoaded, toast])

  const handleDocumentDelete = () => {
    // Refresh the documents list after deletion
    if (userId) {
      setIsLoading(true)
      getUserDocumentsAction(userId)
        .then((docs) => {
          setDocuments(docs)
          setFilteredDocuments(docs)
        })
        .catch((error) => {
          console.error("Error refreshing documents:", error)
          toast({
            title: "Failed to refresh documents",
            description: "There was an error refreshing your documents",
            variant: "destructive",
          })
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }

  if (!isLoaded) {
    return (
      <div className="container mx-auto py-10 px-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <motion.div
        className="container mx-auto py-10 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6">My Documents</h1>
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <p>Please log in to view your documents</p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <ErrorBoundary>
      <motion.div
        className="container mx-auto py-10 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold">My Documents</h1>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search documents..."
                  className="pl-8 w-full md:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/upload">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-md p-4 mb-6">
              <p className="text-red-500">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          )}

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground grid grid-cols-4 mb-8 overflow-x-auto">
              <TabsTrigger value="all" className="flex items-center transition duration-200">
                <FileText className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">All Documents</span>
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center transition duration-200">
                <Calendar className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Recent</span>
              </TabsTrigger>
              <TabsTrigger value="historical" className="flex items-center transition duration-200">
                <FileText className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Historical</span>
              </TabsTrigger>
              <TabsTrigger value="manuscripts" className="flex items-center transition duration-200">
                <FileText className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Manuscripts</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredDocuments.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 document-grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredDocuments.map((doc) => (
                    <DocumentCard key={doc._id} document={doc} onDelete={handleDocumentDelete} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  className="text-center py-20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No documents found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery ? "No documents match your search criteria" : "You haven't uploaded any documents yet"}
                  </p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button asChild>
                      <Link href="/upload">Upload Your First Document</Link>
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="recent">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 document-grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredDocuments
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 6)
                    .map((doc) => (
                      <DocumentCard key={doc._id} document={doc} onDelete={handleDocumentDelete} />
                    ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="historical">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 document-grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredDocuments
                    .filter((doc) => doc.type === "historical")
                    .map((doc) => (
                      <DocumentCard key={doc._id} document={doc} onDelete={handleDocumentDelete} />
                    ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="manuscripts">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 document-grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredDocuments
                    .filter((doc) => doc.type === "manuscript")
                    .map((doc) => (
                      <DocumentCard key={doc._id} document={doc} onDelete={handleDocumentDelete} />
                    ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </ErrorBoundary>
  )
}
