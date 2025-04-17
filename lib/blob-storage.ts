import { put, list, del } from "@vercel/blob"

export async function uploadToBlob(file: File, folder = "documents"): Promise<string> {
  try {
    // Generate a unique filename with original extension
    const filename = `${folder}/${Date.now()}-${file.name}`

    // Upload to Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
    })

    return url
  } catch (error) {
    console.error("Error uploading to blob storage:", error)
    throw new Error("Failed to upload file to storage")
  }
}

export async function deleteFromBlob(url: string): Promise<void> {
  try {
    await del(url)
  } catch (error) {
    console.error("Error deleting from blob storage:", error)
    throw new Error("Failed to delete file from storage")
  }
}

export async function listBlobFiles(prefix = "documents/"): Promise<{ url: string; pathname: string }[]> {
  try {
    const { blobs } = await list({ prefix })
    return blobs
  } catch (error) {
    console.error("Error listing blob files:", error)
    throw new Error("Failed to list files from storage")
  }
}
