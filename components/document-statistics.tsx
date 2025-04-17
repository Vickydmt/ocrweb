"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell } from "recharts"

interface DocumentStatisticsProps {
  content: string
  language: string
}

export function DocumentStatistics({ content, language }: DocumentStatisticsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [wordSortType, setWordSortType] = useState<"longer" | "shorter" | "frequent">("longer")

  useEffect(() => {
    if (!content) {
      setIsLoading(false)
      return
    }

    // Calculate statistics
    const calculateStats = () => {
      // Character count (including spaces)
      const charCount = content.length

      // Character count (excluding spaces)
      const charCountNoSpaces = content.replace(/\s/g, "").length

      // Word count - handle multilingual text by splitting on whitespace
      // Only count words with 2 or more characters
      const words = content
        .trim()
        .split(/\s+/)
        .filter((word) => word.length >= 2)
      const wordCount = words.length

      // Line count
      const lineCount = (content.match(/\n/g) || []).length + 1

      // Paragraph count (separated by double newlines)
      const paragraphCount = content.split(/\n\s*\n/).filter(Boolean).length || 1

      // Sentence count - handle multilingual text
      // This is a simplified approach that works for many languages
      const sentenceCount = (content.match(/[.!?।॥؟।፨።۔]/g) || []).length || 1

      // Word frequency - create a map of words to their counts
      const wordFrequency: Record<string, number> = {}
      words.forEach((word) => {
        // Normalize the word (lowercase, remove punctuation)
        const normalizedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        if (normalizedWord && normalizedWord.length >= 2) {
          wordFrequency[normalizedWord] = (wordFrequency[normalizedWord] || 0) + 1
        }
      })

      // Calculate unique words
      const uniqueWordCount = Object.keys(wordFrequency).length
      const uniqueWordPercentage = Math.round((uniqueWordCount / wordCount) * 100) || 0

      // Calculate reading time (average 200 words per minute)
      const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

      // Calculate word length distribution
      const wordLengthDistribution: Record<number, number> = {}
      words.forEach((word) => {
        const length = word.length
        if (length >= 2) {
          // Only count words with 2+ characters
          wordLengthDistribution[length] = (wordLengthDistribution[length] || 0) + 1
        }
      })

      // Convert to array for chart
      const wordLengthData = Object.entries(wordLengthDistribution)
        .map(([length, count]) => ({ length: Number(length), count }))
        .filter((item) => item.length > 0) // Filter out empty words
        .sort((a, b) => a.length - b.length)

      // Document composition data
      const spaces = (content.match(/\s/g) || []).length
      const punctuation = (content.match(/[.,/#!$%^&*;:{}=\-_`~()]/g) || []).length
      const total = charCount

      const compositionData = [
        { name: "Words", value: wordCount, percentage: Math.round((wordCount / total) * 100) },
        { name: "Spaces", value: spaces, percentage: Math.round((spaces / total) * 100) },
        { name: "Punctuation", value: punctuation, percentage: Math.round((punctuation / total) * 100) },
      ]

      return {
        charCount,
        charCountNoSpaces,
        wordCount,
        lineCount,
        sentenceCount,
        paragraphCount,
        readingTimeMinutes,
        uniqueWordCount,
        uniqueWordPercentage,
        wordFrequency,
        wordLengthData,
        compositionData,
      }
    }

    try {
      const documentStats = calculateStats()
      setStats(documentStats)
    } catch (error) {
      console.error("Error calculating document statistics:", error)
    } finally {
      setIsLoading(false)
    }
  }, [content])

  // Function to get top words based on selected sort type
  function getTopWords(count = 5) {
    if (!stats || !stats.wordFrequency) return []

    const entries = Object.entries(stats.wordFrequency)

    let sortedEntries
    switch (wordSortType) {
      case "longer":
        // Sort by length (longer first), then by frequency
        sortedEntries = entries.sort((a, b) => {
          const lengthDiff = b[0].length - a[0].length
          return lengthDiff !== 0 ? lengthDiff : b[1] - a[1]
        })
        break
      case "shorter":
        // Sort by length (shorter first), then by frequency
        sortedEntries = entries.sort((a, b) => {
          const lengthDiff = a[0].length - b[0].length
          return lengthDiff !== 0 ? lengthDiff : b[1] - a[1]
        })
        break
      case "frequent":
        // Sort by frequency only
        sortedEntries = entries.sort((a, b) => b[1] - a[1])
        break
      default:
        sortedEntries = entries.sort((a, b) => b[1] - a[1])
    }

    return sortedEntries.slice(0, count).map(([word, count]) => ({ word, count }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Statistics</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Statistics</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">No content available for analysis</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Document Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="word-analysis">Word Analysis</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Characters</h3>
                <p className="text-3xl font-bold">{stats.charCount.toLocaleString()}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Words</h3>
                <p className="text-3xl font-bold">{stats.wordCount.toLocaleString()}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Lines</h3>
                <p className="text-3xl font-bold">{stats.lineCount.toLocaleString()}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Sentences</h3>
                <p className="text-3xl font-bold">{stats.sentenceCount.toLocaleString()}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Paragraphs</h3>
                <p className="text-3xl font-bold">{stats.paragraphCount.toLocaleString()}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Reading Time</h3>
                <p className="text-3xl font-bold">{stats.readingTimeMinutes} min</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Unique Words</h3>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${stats.uniqueWordPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.uniqueWordCount} unique words out of {stats.wordCount} total words
                <span className="float-right">{stats.uniqueWordPercentage}%</span>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="word-analysis">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Top Words</h3>
              <Select
                value={wordSortType}
                onValueChange={(value: "longer" | "shorter" | "frequent") => setWordSortType(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select word priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="longer">Prioritize Longer Words</SelectItem>
                  <SelectItem value="shorter">Prioritize Shorter Words</SelectItem>
                  <SelectItem value="frequent">Prioritize Repeated Words</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-2">
              {getTopWords(10).map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{item.word}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Word Length Distribution</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.wordLengthData.filter((item) => item.length >= 2)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="length" label={{ value: "Word Length", position: "insideBottom", offset: -5 }} />
                    <YAxis label={{ value: "Count", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="charts">
            <div className="flex justify-end mb-6">
              <Select
                value={wordSortType}
                onValueChange={(value: "longer" | "shorter" | "frequent") => setWordSortType(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Prioritize Longer Words" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="longer">Prioritize Longer Words</SelectItem>
                  <SelectItem value="shorter">Prioritize Shorter Words</SelectItem>
                  <SelectItem value="frequent">Prioritize Repeated Words</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-medium mb-6 text-center">Document Composition</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.compositionData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.compositionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={["#3b82f6", "#10b981", "#f59e0b"][index % 3]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            `${value} (${((value / stats.charCount) * 100).toFixed(0)}%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center mt-4">
                    <div className="flex flex-wrap gap-4">
                      {stats.compositionData.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"][index % 3] }}
                          ></div>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-6 text-center">Top Words Distribution</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getTopWords(5)}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="word"
                          label={({ word, percent }) => `${word}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {getTopWords(5).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center mt-4">
                    <div className="flex flex-wrap gap-4">
                      {getTopWords(5).map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5],
                            }}
                          ></div>
                          <span>{item.word}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
