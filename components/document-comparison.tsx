"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeftRight, Download } from "lucide-react"
import { motion } from "framer-motion"
import type { Document } from "@/lib/mock-data-service"
import { diffChars, diffWords, diffLines } from "diff"

interface DocumentComparisonProps {
  documents: Document[]
  onClose?: () => void
}

export function DocumentComparison({ documents, onClose }: DocumentComparisonProps) {
  const [selectedDoc1, setSelectedDoc1] = useState<string>("")
  const [selectedDoc2, setSelectedDoc2] = useState<string>("")
  const [doc1Content, setDoc1Content] = useState<string>("")
  const [doc2Content, setDoc2Content] = useState<string>("")
  const [diffMode, setDiffMode] = useState<"chars" | "words" | "lines">("words")
  const [diffResult, setDiffResult] = useState<any[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Set default selections if documents are available
    if (documents.length >= 2) {
      setSelectedDoc1(documents[0]._id)
      setSelectedDoc2(documents[1]._id)
    } else if (documents.length === 1) {
      setSelectedDoc1(documents[0]._id)
    }
  }, [documents])

  useEffect(() => {
    // Update content when selections change
    if (selectedDoc1) {
      const doc = documents.find((d) => d._id === selectedDoc1)
      if (doc) setDoc1Content(doc.content)
    }

    if (selectedDoc2) {
      const doc = documents.find((d) => d._id === selectedDoc2)
      if (doc) setDoc2Content(doc.content)
    }
  }, [selectedDoc1, selectedDoc2, documents])

  const compareDocuments = () => {
    if (!doc1Content || !doc2Content) {
      toast({
        title: "Missing content",
        description: "Please select two documents to compare",
        variant: "destructive",
      })
      return
    }

    setIsComparing(true)

    try {
      let result
      switch (diffMode) {
        case "chars":
          result = diffChars(doc1Content, doc2Content)
          break
        case "words":
          result = diffWords(doc1Content, doc2Content)
          break
        case "lines":
          result = diffLines(doc1Content, doc2Content)
          break
        default:
          result = diffWords(doc1Content, doc2Content)
      }

      setDiffResult(result)
    } catch (error) {
      console.error("Comparison error:", error)
      toast({
        title: "Comparison failed",
        description: "There was an error comparing the documents",
        variant: "destructive",
      })
    } finally {
      setIsComparing(false)
    }
  }

  const downloadComparison = () => {
    try {
      // Create a formatted text representation of the diff
      let diffText = "Document Comparison Results\n"
      diffText += "=========================\n\n"

      const doc1 = documents.find((d) => d._id === selectedDoc1)
      const doc2 = documents.find((d) => d._id === selectedDoc2)

      diffText += `Document 1: ${doc1?.name || "Unknown"}\n`
      diffText += `Document 2: ${doc2?.name || "Unknown"}\n\n`
      diffText += `Comparison Mode: ${diffMode}\n\n`
      diffText += "Differences:\n"
      diffText += "------------\n\n"

      diffResult.forEach((part) => {
        const prefix = part.added ? "+ " : part.removed ? "- " : "  "
        diffText += prefix + part.value.split("\n").join("\n" + prefix) + "\n"
      })

      // Create and trigger download
      const blob = new Blob([diffText], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `comparison-${doc1?.name || "doc1"}-${doc2?.name || "doc2"}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Download started",
        description: "Your comparison results are being downloaded",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading the comparison results",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Document Comparison Tool</CardTitle>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document 1</label>
              <Select value={selectedDoc1} onValueChange={setSelectedDoc1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc._id} value={doc._id}>
                      {doc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Document 2</label>
              <Select value={selectedDoc2} onValueChange={setSelectedDoc2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc._id} value={doc._id}>
                      {doc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2 w-full sm:w-auto">
              <label className="text-sm font-medium">Comparison Mode</label>
              <Select value={diffMode} onValueChange={(value: "chars" | "words" | "lines") => setDiffMode(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chars">Character by Character</SelectItem>
                  <SelectItem value="words">Word by Word</SelectItem>
                  <SelectItem value="lines">Line by Line</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={compareDocuments}
                disabled={isComparing || !selectedDoc1 || !selectedDoc2}
                className="w-full sm:w-auto"
              >
                {isComparing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Compare Documents
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {diffResult.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Comparison Results</h3>
                <Button variant="outline" size="sm" onClick={downloadComparison}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Results
                </Button>
              </div>

              <div className="border rounded-md p-4 bg-muted/20 overflow-auto max-h-[400px]">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {diffResult.map((part, index) => (
                    <span
                      key={index}
                      className={
                        part.added
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : part.removed
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : ""
                      }
                    >
                      {part.value}
                    </span>
                  ))}
                </pre>
              </div>
            </div>
          )}

          <Tabs defaultValue="original">
            <TabsList>
              <TabsTrigger value="original">Original Documents</TabsTrigger>
              <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
            </TabsList>

            <TabsContent value="original" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Document 1</h3>
                  <Textarea value={doc1Content} readOnly className="min-h-[300px] font-mono text-sm" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Document 2</h3>
                  <Textarea value={doc2Content} readOnly className="min-h-[300px] font-mono text-sm" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="side-by-side">
              <div className="overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left">Document 1</th>
                      <th className="border p-2 text-left">Document 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc1Content.split("\n").map((line, i) => (
                      <tr key={i}>
                        <td className="border p-2 font-mono text-sm whitespace-pre-wrap">{line}</td>
                        <td className="border p-2 font-mono text-sm whitespace-pre-wrap">
                          {doc2Content.split("\n")[i] || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
