# CircuitVerse Backend API

Backend API server for generating CircuitVerse circuits using NVIDIA Nemotron Nano VL model.

## Features

- 💬 **Text Chat** - General purpose chat endpoint
- 🖼️ **Vision Chat** - Chat with images/video using Nemotron VL
- ⚡ **Circuit Generation** - AI-powered circuit generation for CircuitVerse
- 🌊 **Streaming Support** - Real-time streaming responses
- 📦 **File Upload** - Support for images (PNG, JPG, WEBP) and videos (MP4, WEBM, MOV)

## Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Set API Key:**

Create a `.env` file or set environment variable:
```bash
export NVIDIA_API_KEY="your_api_key_here"
```

Or get a free API key from: https://build.nvidia.com/

3. **Start server:**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

Server will start on `http://localhost:3000`

## API Endpoints

### 1. Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T..."
}
```

### 2. Text Chat
```bash
POST /api/chat
Content-Type: application/json
```

**Body:**
```json
{
  "query": "What is a half adder?",
  "stream": false,
  "useThinking": false
}
```

**Response:**
```json
{
  "success": true,
  "response": "A half adder is...",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60
  }
}
```

### 3. Chat with Media
```bash
POST /api/chat-media
Content-Type: multipart/form-data
```

**Form Data:**
- `query` (string): Your question about the media
- `media` (files): One or more image files, or a single video file
- `stream` (boolean, optional): Enable streaming
- `useThinking` (boolean, optional): Enable reasoning mode

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/chat-media \
  -F "query=Describe this circuit diagram" \
  -F "media=@circuit.png"
```

**Response:**
```json
{
  "success": true,
  "response": "This circuit shows...",
  "usage": {...}
}
```

### 4. Generate Circuit (CircuitVerse)
```bash
POST /api/generate-circuit
Content-Type: application/json
```

**Body:**
```json
{
  "description": "Create a half adder circuit",
  "stream": false
}
```

**Response:**
```json
{
  "success": true,
  "circuit": {
    "name": "Half Adder",
    "description": "Adds two single-bit binary numbers",
    "elements": [
      {
        "id": "input_a",
        "type": "Input",
        "label": "A"
      },
      ...
    ],
    "connections": [...]
  },
  "rawResponse": "...",
  "usage": {...}
}
```

## Streaming Responses

For streaming, set `stream: true` in the request body. The response will be sent as Server-Sent Events (SSE):

```javascript
const eventSource = new EventSource('/api/chat?stream=true');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.content);
};
```

## Usage Examples

### Example 1: Text Chat
```javascript
fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Explain how an AND gate works',
    useThinking: true
  })
})
.then(res => res.json())
.then(data => console.log(data.response));
```

### Example 2: Analyze Circuit Image
```javascript
const formData = new FormData();
formData.append('query', 'What type of circuit is this?');
formData.append('media', fileInput.files[0]);

fetch('http://localhost:3000/api/chat-media', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => console.log(data.response));
```

### Example 3: Generate Circuit
```javascript
fetch('http://localhost:3000/api/generate-circuit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Create a 4-bit binary adder'
  })
})
.then(res => res.json())
.then(data => {
  // Use the circuit JSON with CircuitVerse extension
  createCircuitFromJSON(JSON.stringify(data.circuit));
});
```

### Example 4: Streaming Circuit Generation
```javascript
fetch('http://localhost:3000/api/generate-circuit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Create an SR latch',
    stream: true
  })
})
.then(response => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  function readStream() {
    reader.read().then(({ done, value }) => {
      if (done) return;
      const text = decoder.decode(value);
      console.log(text);
      readStream();
    });
  }
  readStream();
});
```

## Integration with CircuitVerse Extension

The `/api/generate-circuit` endpoint generates JSON that can be directly used with the CircuitVerse Chrome extension:

1. Generate circuit via API
2. Get the JSON response
3. In CircuitVerse console, run:
```javascript
createCircuitFromJSON(circuitJSON);
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NVIDIA_API_KEY` - NVIDIA API key for Nemotron access

## File Uploads

- **Max file size:** 50MB
- **Supported formats:**
  - Images: PNG, JPG, JPEG, WEBP
  - Videos: MP4, WEBM, MOV
- **Limitations:** Only single video per request, multiple images allowed

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error message description"
}
```

Common status codes:
- `200` - Success
- `400` - Bad request (missing parameters)
- `500` - Server error

## Project Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies
├── README.md         # This file
└── uploads/          # Temporary upload directory (auto-created)
```

## Notes

- Uploaded files are automatically deleted after processing
- The `/think` mode provides reasoning steps, `/no_think` gives direct answers
- Video processing only supports single video files
- Circuit generation uses the CONTEXT_FOR_AI.md for better results

## Troubleshooting

**API Key Error:**
```
Error: Invalid API key
```
Solution: Set `NVIDIA_API_KEY` environment variable

**File Upload Error:**
```
Error: File format not supported
```
Solution: Ensure file is PNG, JPG, WEBP, MP4, WEBM, or MOV

**Port Already in Use:**
```
Error: Port 3000 is already in use
```
Solution: Set different port: `PORT=3001 npm start`

## License

MIT
