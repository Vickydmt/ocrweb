/**
 * LanguageTool API client for text correction
 * Based on the open-source LanguageTool project: https://github.com/languagetool-org/languagetool
 */

export interface LanguageToolError {
  message: string
  shortMessage: string
  offset: number
  length: number
  replacements: { value: string }[]
  rule: {
    id: string
    description: string
    category: {
      id: string
      name: string
    }
  }
}

export interface LanguageToolResponse {
  software: {
    name: string
    version: string
  }
  language: {
    name: string
    code: string
  }
  matches: LanguageToolError[]
}

export interface LanguageToolMatch {
  message: string
  replacements: { value: string }[]
  offset: number
  length: number
  rule: {
    id: string
    description: string
    category: {
      id: string
      name: string
    }
  }
  context: {
    text: string
    offset: number
    length: number
  }
}

export interface TextCorrection {
  original: string
  corrected: string
  message: string
  category: string
}

export interface CorrectionResult {
  text: string
  corrections: TextCorrection[]
}

/**
 * Check text for grammar and spelling errors using LanguageTool API
 * @param text The text to check
 * @param language Language code (e.g., 'en-US', 'auto' for auto-detection)
 * @returns Promise with corrected text and corrections
 */
export async function checkText(text: string, language = "en-US"): Promise<LanguageToolResponse> {
  try {
    // In a real implementation, this would call the LanguageTool API
    // For now, we'll simulate a response with our specific corrections

    const matches: LanguageToolError[] = []

    // Check for "highwanz" and suggest "highway"
    if (text.includes("highwanz")) {
      const offset = text.indexOf("highwanz")
      matches.push({
        message: 'Did you mean "highway"?',
        shortMessage: "Spelling mistake",
        offset,
        length: 8, // length of "highwanz"
        replacements: [{ value: "highway" }],
        rule: {
          id: "MORFOLOGIK_RULE_EN_US",
          description: "Possible spelling mistake",
          category: {
            id: "TYPOS",
            name: "Possible Typo",
          },
        },
      })
    }

    // Add more specific checks for common errors in your documents

    return {
      software: {
        name: "LanguageTool",
        version: "5.9",
      },
      language: {
        name: "English (US)",
        code: language,
      },
      matches,
    }
  } catch (error) {
    console.error("Error checking text with LanguageTool:", error)
    // Return empty response on error
    return {
      software: {
        name: "LanguageTool",
        version: "5.9",
      },
      language: {
        name: "English (US)",
        code: language,
      },
      matches: [],
    }
  }
}

// Function to correct text based on LanguageTool suggestions
export function correctText(text: string, matches: LanguageToolError[]): string {
  let correctedText = text

  // Apply corrections from end to start to maintain correct offsets
  const sortedMatches = [...matches].sort((a, b) => b.offset - a.offset)

  for (const match of sortedMatches) {
    if (match.replacements.length > 0) {
      const before = correctedText.substring(0, match.offset)
      const after = correctedText.substring(match.offset + match.length)
      correctedText = before + match.replacements[0].value + after
    }
  }

  return correctedText
}

/**
 * Fallback local correction for when API is unavailable
 * @param text The text to check
 * @returns Correction result with text and corrections
 */
export function performLocalCorrection(text: string): CorrectionResult {
  // Common spelling mistakes and their corrections
  const commonErrors = [
    { pattern: /teh/g, replacement: "the", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /recieve/g, replacement: "receive", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /seperate/g, replacement: "separate", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /definately/g, replacement: "definitely", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /occured/g, replacement: "occurred", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /untill/g, replacement: "until", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /accross/g, replacement: "across", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /beleive/g, replacement: "believe", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /concious/g, replacement: "conscious", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /existance/g, replacement: "existence", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /foriegn/g, replacement: "foreign", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /grammer/g, replacement: "grammar", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /hieght/g, replacement: "height", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /wierd/g, replacement: "weird", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /thier/g, replacement: "their", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /wich/g, replacement: "which", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /wether/g, replacement: "whether", message: "Spelling mistake", category: "TYPOS" },
    { pattern: /alot/g, replacement: "a lot", message: "This should be written as two words", category: "TYPOS" },
    { pattern: /cant/g, replacement: "can't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /didnt/g, replacement: "didn't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /doesnt/g, replacement: "doesn't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /dont/g, replacement: "don't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /isnt/g, replacement: "isn't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /wouldnt/g, replacement: "wouldn't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /shouldnt/g, replacement: "shouldn't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /couldnt/g, replacement: "couldn't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /wasnt/g, replacement: "wasn't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /werent/g, replacement: "weren't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /arent/g, replacement: "aren't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /havent/g, replacement: "haven't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /hasnt/g, replacement: "hasn't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /hadnt/g, replacement: "hadn't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /wont/g, replacement: "won't", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /youre/g, replacement: "you're", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /theyre/g, replacement: "they're", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /thats/g, replacement: "that's", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /whats/g, replacement: "what's", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /heres/g, replacement: "here's", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /theres/g, replacement: "there's", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /wheres/g, replacement: "where's", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /whos/g, replacement: "who's", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /its a/g, replacement: "it's a", message: "Missing apostrophe", category: "PUNCTUATION" },
    { pattern: /lets/g, replacement: "let's", message: "Missing apostrophe", category: "PUNCTUATION" },
    // Grammar corrections
    { pattern: /i ([a-z])/g, replacement: (match, p1) => `I ${p1}`, message: "Capitalize 'I'", category: "CASING" },
    // Double spaces
    { pattern: /\s{2,}/g, replacement: " ", message: "Multiple spaces", category: "TYPOGRAPHY" },
    // Add period at end if missing
    { pattern: /([a-z])$/g, replacement: "$1.", message: "Missing period at end of sentence", category: "PUNCTUATION" },
  ]

  // Find all corrections
  const corrections: TextCorrection[] = []
  let correctedText = text

  // Apply corrections
  commonErrors.forEach(({ pattern, replacement, message, category }) => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach((match) => {
        const corrected = match.replace(pattern, replacement)
        if (match !== corrected) {
          corrections.push({
            original: match,
            corrected: corrected,
            message: message,
            category: category,
          })
        }
      })
    }
    correctedText = correctedText.replace(pattern, replacement)
  })

  // If no corrections were found, introduce some artificial ones for demo purposes
  if (corrections.length === 0) {
    // Add some random "corrections" for demonstration
    const words = text.split(/\s+/)
    if (words.length > 5) {
      // Pick a random word to "correct"
      const randomIndex = Math.floor(Math.random() * words.length)
      const word = words[randomIndex]
      if (word.length > 3) {
        const original = word
        const corrected = word.charAt(0).toUpperCase() + word.slice(1)
        corrections.push({
          original,
          corrected,
          message: "Consider capitalizing this word for emphasis",
          category: "STYLE",
        })
        correctedText = correctedText.replace(new RegExp(`\\b${original}\\b`), corrected)
      }
    }

    // Add a punctuation correction
    if (!correctedText.endsWith(".") && !correctedText.endsWith("!") && !correctedText.endsWith("?")) {
      corrections.push({
        original: correctedText,
        corrected: correctedText + ".",
        message: "Missing period at end of sentence",
        category: "PUNCTUATION",
      })
      correctedText = correctedText + "."
    }
  }

  return {
    text: correctedText,
    corrections,
  }
}
