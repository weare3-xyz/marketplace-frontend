/**
 * Pinata IPFS Upload Utility
 *
 * Handles uploading profile images to Pinata IPFS
 */

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT

/**
 * Upload image file to Pinata IPFS
 *
 * @param file - Image file to upload
 * @returns IPFS URL of uploaded image
 */
export async function uploadImageToPinata(file: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // Add metadata
    const metadata = JSON.stringify({
      name: `profile-${Date.now()}-${file.name}`,
      keyvalues: {
        type: 'profile-image',
        uploadedAt: new Date().toISOString()
      }
    })
    formData.append('pinataMetadata', metadata)

    // Pin options
    const options = JSON.stringify({
      cidVersion: 1,
    })
    formData.append('pinataOptions', options)

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        // Don't set Content-Type - browser will set it with boundary for FormData
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`)
    }

    const data = await response.json()
    const ipfsHash = data.IpfsHash

    // Return IPFS gateway URL
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`

    console.log('✅ Image uploaded to IPFS:', ipfsUrl)
    return ipfsUrl

  } catch (error) {
    console.error('Failed to upload to Pinata:', error)
    throw new Error(
      `Failed to upload image to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Validate image file
 *
 * @param file - File to validate
 * @returns true if valid, error message if invalid
 */
export function validateImageFile(file: File): string | true {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)'
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    return 'Image size must be less than 5MB'
  }

  return true
}

/**
 * Get IPFS gateway URL from hash
 */
export function getIPFSGatewayUrl(ipfsHash: string): string {
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
}

/**
 * Check if Pinata is configured
 */
export function isPinataConfigured(): boolean {
  return !!(PINATA_JWT && PINATA_JWT !== 'your_pinata_jwt_here')
}
