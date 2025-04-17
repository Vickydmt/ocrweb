import { BlobServiceClient } from "@azure/storage-blob"

// Azure Blob Storage configuration
const sasToken =
  "sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2027-01-01T11:35:32Z&st=2025-04-14T03:35:32Z&spr=https&sig=FfQUZCfLeHMHVQAtkZVLMr9jEjs5l9SGaJkwAeeDB3I%3D"
const storageAccountName = "docudigitize"
const containerName = "documents"

// Create the BlobServiceClient object with SAS token
const blobServiceClient = new BlobServiceClient(`https://${storageAccountName}.blob.core.windows.net/?${sasToken}`)

// Get a reference to a container
const containerClient = blobServiceClient.getContainerClient(containerName)

export async function uploadToAzure(file: File, folder = "documents"): Promise<string> {
  try {
    // Generate a unique filename with original extension
    const filename = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(filename)

    // Upload file
    await blockBlobClient.uploadData(await file.arrayBuffer(), {
      blobHTTPHeaders: { blobContentType: file.type },
    })

    // Get the URL with SAS token for direct access
    const url = `${blockBlobClient.url}?${sasToken}`

    return url
  } catch (error) {
    console.error("Error uploading to Azure Blob Storage:", error)
    throw new Error("Failed to upload file to Azure storage")
  }
}

export async function deleteFromAzure(url: string): Promise<void> {
  try {
    // Extract the blob name from the URL
    const blobName = extractBlobNameFromUrl(url)

    if (!blobName) {
      throw new Error("Invalid blob URL")
    }

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    // Delete the blob
    await blockBlobClient.delete()
  } catch (error) {
    console.error("Error deleting from Azure Blob Storage:", error)
    throw new Error("Failed to delete file from Azure storage")
  }
}

export async function listAzureFiles(prefix = "documents/"): Promise<{ url: string; pathname: string }[]> {
  try {
    const blobs: { url: string; pathname: string }[] = []

    // List blobs in the container
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobs.push({
        url: `https://${storageAccountName}.blob.core.windows.net/${containerName}/${blob.name}?${sasToken}`,
        pathname: blob.name,
      })
    }

    return blobs
  } catch (error) {
    console.error("Error listing Azure Blob Storage files:", error)
    throw new Error("Failed to list files from Azure storage")
  }
}

// Helper function to extract blob name from URL
function extractBlobNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // The pathname starts with a slash and includes the container name
    const fullPath = urlObj.pathname
    // Remove the leading slash and container name
    const parts = fullPath.split("/")
    // Remove the first empty string (from leading slash) and the container name
    parts.splice(0, 2)
    return parts.join("/")
  } catch (error) {
    console.error("Error extracting blob name from URL:", error)
    return null
  }
}

// Helper function to ensure URL has SAS token
export function ensureAzureUrlHasSasToken(url: string): string {
  if (!url) return url

  if (url.includes("docudigitize.blob.core.windows.net") && !url.includes("sv=")) {
    // Remove any existing query parameters
    const baseUrl = url.split("?")[0]
    return `${baseUrl}?${sasToken}`
  }

  return url
}
