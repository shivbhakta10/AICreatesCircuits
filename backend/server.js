import express from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize OpenAI client
const kApiKey = process.env.NVIDIA_API_KEY;

if (!kApiKey) {
  console.error('❌ ERROR: NVIDIA_API_KEY not found in environment variables');
  console.error('Please create a .env file with your API key:');
  console.error('NVIDIA_API_KEY=your_api_key_here');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: kApiKey,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Core text-only chat function
async function textChat(query, useThinking = false) {
  const systemPrompt = useThinking ? "/think" : "/no_think";

  const messages = [
    {
      "role": "system",
      "content": systemPrompt
    },
    {
      "role": "user",
      "content": query
    }
  ];

  const payload = {
    max_tokens: 4096,
    temperature: 1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    messages: messages,
    stream: false,
    model: "nvidia/nemotron-nano-12b-v2-vl"
  };

  return await openai.chat.completions.create(payload);
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Circuit generation endpoint - integrates with CircuitVerse
app.post('/api/generate-circuit', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Circuit description is required' });
    }

    // Load context for AI
    const contextPath = path.join(__dirname, '../ext/CONTEXT_FOR_AI.md');
    const context = fs.existsSync(contextPath) 
      ? fs.readFileSync(contextPath, 'utf-8')
      : 'Use CircuitVerse JSON schema to generate circuits.';

    const prompt = `${context}

Generate a CircuitVerse circuit JSON definition for: ${description}

CRITICAL REQUIREMENTS:
1. **USE PRE-BUILT COMPONENTS** when available:
   - For adders/addition: use "Adder" (nodes: inpA, inpB, carryIn -> sum, carryOut)
   - For ALU/arithmetic: use "ALU" (nodes: inp1, inp2, controlSignalInput -> output, carryOut)
   - For mux/selection: use "Multiplexer" (nodes: inp[0], inp[1], ..., controlSignalInput -> output1)
   - For demux: use "Demultiplexer" (nodes: input, controlSignalInput -> output1[0], output1[1], ...)
   - For flip-flops: use DflipFlop, TflipFlop, etc.
   - ONLY use basic gates (AndGate, OrGate, etc.) for custom logic or when explicitly requested

2. Use EXACT node names from the documentation
3. Set bitWidth property for multi-bit signals (must match on connected elements)
4. Label inputs as A, B, C and outputs meaningfully (SUM, CARRY, RESULT, Q, etc.)
5. Set labelDirection to "UP" for all components
6. Use snake_case for element IDs

Return ONLY the JSON without any markdown formatting or explanations.`;

    const completion = await textChat(prompt, true);
    const response = completion.choices[0]?.message?.content || '';
    
    // console.log('Raw AI response:', response);
    
    // Try to parse JSON from response - improved extraction
    try {
      let jsonStr = response;
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to find JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const circuitJSON = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!circuitJSON.elements || !Array.isArray(circuitJSON.elements)) {
        throw new Error('Invalid circuit JSON: missing elements array');
      }
      
    //   console.log('Parsed circuit:', JSON.stringify(circuitJSON, null, 2));
      
      res.json({
        success: true,
        circuit: circuitJSON,
        rawResponse: response
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      res.json({
        success: false,
        error: 'Failed to parse circuit JSON: ' + parseError.message,
        rawResponse: response
      });
    }
  } catch (error) {
    console.error('Error in /api/generate-circuit:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /api/generate-circuit - Generate CircuitVerse circuits`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});
