import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with the provided credentials
const supabaseUrl = "https://cjzzftgoftzjqvyhoamw.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqenpmdGdvZnR6anF2eWhvYW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDMyNzEsImV4cCI6MjA1OTI3OTI3MX0.qtlg4w-dYQdT7TvCeG2sXAvuDb3SdfvqyRtZtR05mWU"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadToStorage(file: File, folder = "documents"): Promise<string> {
  try {
    // Generate a unique filename with original extension
    const filename = `${folder}/${Date.now()}-${file.name}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("docudigitize").upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage.from("docudigitize").getPublicUrl(filename)

    return urlData.publicUrl
  } catch (error) {
    console.error("Error uploading to storage:", error)
    throw new Error("Failed to upload file to storage")
  }
}

export async function deleteFromStorage(url: string): Promise<void> {
  try {
    // Extract the path from the URL
    const urlObj = new URL(url)
    const path = urlObj.pathname.split("/").slice(2).join("/")

    // Delete from Supabase Storage
    const { error } = await supabase.storage.from("docudigitize").remove([path])

    if (error) throw error
  } catch (error) {
    console.error("Error deleting from storage:", error)
    throw new Error("Failed to delete file from storage")
  }
}

export async function listStorageFiles(prefix = "documents/"): Promise<{ url: string; pathname: string }[]> {
  try {
    // List files from Supabase Storage
    const { data, error } = await supabase.storage.from("docudigitize").list(prefix)

    if (error) throw error

    // Map to the expected format
    return data.map((item) => {
      const publicUrl = supabase.storage.from("docudigitize").getPublicUrl(`${prefix}${item.name}`).data.publicUrl

      return {
        url: publicUrl,
        pathname: `${prefix}${item.name}`,
      }
    })
  } catch (error) {
    console.error("Error listing storage files:", error)
    throw new Error("Failed to list files from storage")
  }
}
