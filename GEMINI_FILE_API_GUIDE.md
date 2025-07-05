# Gemini File API Integration

## Overview

The Gemini MCP Server now supports the Gemini File API, enabling you to upload and analyze files up to **2GB** in size. This is a massive improvement over the previous ~20MB limitation when using inline base64 encoding.

## Key Features

- **Upload files up to 2GB** using resumable upload protocol
- **Files persist for 48 hours** - reuse across multiple operations
- **No additional cost** - File API is free to use
- **Support for all media types** - video, audio, images, documents
- **Direct video analysis** - analyze hour-long videos without compression

## How It Works

### 1. Upload Large Files First

For files over 100MB (or any file you want to reuse), upload it first:

```
Tool: gemini-upload-file
Arguments:
{
  "operation": "upload",
  "file_path": "/path/to/large-video.mp4",
  "display_name": "My Training Video"
}
```

This returns a file URI like: `https://generativelanguage.googleapis.com/v1beta/files/abc123`

### 2. Use the File URI in Analysis

Then analyze the video using its URI:

```
Tool: gemini-analyze-video
Arguments:
{
  "file_uri": "https://generativelanguage.googleapis.com/v1beta/files/abc123",
  "mime_type": "video/mp4",
  "analysis_type": "transcript"
}
```

## File Management Operations

### List Uploaded Files
```
Tool: gemini-upload-file
Arguments:
{
  "operation": "list",
  "page_size": 20
}
```

### Get File Info
```
Tool: gemini-upload-file
Arguments:
{
  "operation": "get",
  "file_name": "files/abc123"
}
```

### Delete a File
```
Tool: gemini-upload-file
Arguments:
{
  "operation": "delete",
  "file_name": "files/abc123"
}
```

## Workflow Example: Analyzing a 1GB Video

1. **Download the video** (if needed):
   ```
   Tool: video-downloader
   Arguments: {
     "url": "https://youtube.com/watch?v=...",
     "output_directory": "/Users/rob/videos"
   }
   ```

2. **Upload to Gemini**:
   ```
   Tool: gemini-upload-file
   Arguments: {
     "operation": "upload",
     "file_path": "/Users/rob/videos/video.mp4"
   }
   ```
   
3. **Analyze the full video**:
   ```
   Tool: gemini-analyze-video
   Arguments: {
     "file_uri": "[returned URI from upload]",
     "mime_type": "video/mp4",
     "analysis_type": "detailed"
   }
   ```

## Benefits Over Compression Workflow

### Before (with compression):
1. Download video (178MB) ✓
2. Compress to under 100MB ✓
3. Analyze compressed version (quality loss) ⚠️
4. Limited to ~20 minutes of video ⚠️

### Now (with File API):
1. Download video (up to 2GB) ✓
2. Upload to Gemini File API ✓
3. Analyze full quality video ✓
4. Analyze hours of content ✓

## Testing the Integration

Run the test script to verify everything is working:

```bash
cd /Users/rob/Claude/mcp-servers/gemini-mcp-server
node test-file-upload.js
```

## Implementation Details

The implementation follows the pattern of your successful MCP servers by:
- Using direct HTTPS requests instead of SDK abstractions
- Implementing the resumable upload protocol correctly
- Supporting all Gemini File API operations
- Integrating seamlessly with existing tools

## Next Steps

1. The video-downloader + gemini workflow now supports 2GB videos
2. Consider adding automatic upload for files over 100MB
3. Could implement file caching to track uploaded files
4. May want to add batch upload capabilities

This upgrade makes Gemini truly capable of analyzing long-form content without compromises!
