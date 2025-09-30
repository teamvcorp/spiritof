# Gift Image Migration

This script migrates all gift images from external URLs to Vercel Blob storage for reliable hosting.

## Setup

1. **Install dependencies:**
   ```bash
   npm install --prefix .
   ```

2. **Set environment variables:**
   ```bash
   # Copy from your main .env.local file
   MONGODB_URI=mongodb+srv://...
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
   ```

   To get your Vercel Blob token:
   - Go to Vercel Dashboard
   - Navigate to Storage > Blob > Settings
   - Copy the Read/Write Token

3. **Create .env file:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

## Usage

### Check current statistics
```bash
node migrate-images.js stats
```

### Run migration
```bash
node migrate-images.js migrate
```

## How it works

1. **Find gifts needing images:** Queries the database for gifts without images or with broken external URLs
2. **Search for real images:** Uses multiple retailers (Amazon, Target, Walmart) to find actual product images
3. **Validate images:** Checks that URLs return valid image content
4. **Download & upload:** Downloads images and uploads to Vercel Blob storage
5. **Update database:** Updates gift records with new Vercel Blob URLs

## Features

- ✅ Searches multiple retailers for real product images
- ✅ Validates image URLs before processing
- ✅ Uploads to Vercel Blob for reliable hosting
- ✅ Falls back to placeholder for unfound images
- ✅ Rate limiting to be respectful to servers
- ✅ Progress tracking and error handling
- ✅ Statistics reporting

## Output

The script provides detailed logging:
- 🔍 Search progress
- 📥 Download status
- ☁️ Upload confirmation
- ✅ Success/failure counts
- 📊 Final statistics

## Safety

- Non-destructive: Only updates empty/broken imageUrl fields
- Rate limited: 2-second delays between requests
- Fallback: Sets placeholder for unfound images
- Backup: Stores original URL in `originalImageUrl` field