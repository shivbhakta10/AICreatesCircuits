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
async function textChat(query, useThinking = false, temperature = 0.3) {
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
    temperature: temperature, // Lower temperature for more consistent JSON output
    top_p: 0.95,
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

    const prompt = `You are a CircuitVerse circuit designer. Generate a JSON circuit definition.

USER REQUEST: ${description}

CIRCUIT TYPES & COMPONENTS:

1. **Simple Logic Equations** (F = A + B, Y = AB + CD, Y = (AB) + (CD)'):
   Use: Input, AndGate, OrGate, NotGate, XorGate, Output
   
   CRITICAL: For inverted sub-expressions like (CD)':
   - First create an AND/OR gate for the sub-expression
   - Then connect its output to a NOT gate input (NotGate uses "inp1", not "inp[0]")
   - Finally connect NOT gate output to the next stage
   - Example: C and D → AndGate → output1 connects to NotGate → inp1

2. **Multiplexer/Demultiplexer** (when explicitly requested):
   Use: Multiplexer or Demultiplexer component
   - Multiplexer constructor: (x, y, scope, direction, bitWidth, controlSignalSize)
   - controlSignalSize: Number of select bits (1 for 2:1, 2 for 4:1, 3 for 8:1)
   - This automatically creates 2^controlSignalSize data inputs
   - Multiplexer nodes: inp[0], inp[1], ..., controlSignalInput (at bottom), output1 (right side)
   - Data inputs are on LEFT side, control at BOTTOM, output on RIGHT

3. **Adder/Full Adder** (for arithmetic addition or when "full adder" is mentioned):
   Use: Adder component (this IS the full adder component)
   - Input nodes: inpA, inpB, carryIn
   - Output nodes: sum, carryOut
   - DO NOT create full adder using OR/AND/XOR gates - use the Adder component directly

4. **Flip-flops** (D, T, JK, SR):
   Use: DflipFlop, TflipFlop, JKflipFlop, SRflipFlop

JSON SCHEMA:
{
  "name": "Circuit Name",
  "description": "What it does",
  "elements": [
    {"id": "unique_id", "type": "ElementType", "label": "Label", "labelDirection": "UP", "properties": {"inputLength": 2}}
  ],
  "connections": [
    {"from": "source_id", "fromNode": "output1", "to": "target_id", "toNode": "inp[0]"}
  ]
}

NODE NAMING RULES:
- Input/Gate outputs: "output1"
- Multi-input gate inputs (AndGate, OrGate, NandGate, NorGate, XorGate, XnorGate): "inp[0]", "inp[1]", "inp[2]", etc.
- NotGate input: "inp1" (single input, NOT inp[0])
- Adder inputs: "inpA", "inpB", "carryIn"
- Adder outputs: "sum", "carryOut"
- Output element: "inp1"
- Multiplexer control: "controlSignalInput"
- Multiplexer data inputs: "inp[0]", "inp[1]", etc.

EXAMPLE 1 - Complex logic equation "Y = (A • B) + (C • D)'":
{
  "name": "Complex Logic Circuit",
  "description": "Y = (A • B) + (C • D)'",
  "elements": [
    {"id": "input_a", "type": "Input", "label": "A"},
    {"id": "input_b", "type": "Input", "label": "B"},
    {"id": "input_c", "type": "Input", "label": "C"},
    {"id": "input_d", "type": "Input", "label": "D"},
    {"id": "and_ab", "type": "AndGate", "label": "AND", "labelDirection": "UP"},
    {"id": "and_cd", "type": "AndGate", "label": "AND", "labelDirection": "UP"},
    {"id": "not_cd", "type": "NotGate", "label": "NOT", "labelDirection": "UP"},
    {"id": "or_gate", "type": "OrGate", "label": "OR", "labelDirection": "UP"},
    {"id": "output_y", "type": "Output", "label": "Y"}
  ],
  "connections": [
    {"from": "input_a", "fromNode": "output1", "to": "and_ab", "toNode": "inp[0]"},
    {"from": "input_b", "fromNode": "output1", "to": "and_ab", "toNode": "inp[1]"},
    {"from": "input_c", "fromNode": "output1", "to": "and_cd", "toNode": "inp[0]"},
    {"from": "input_d", "fromNode": "output1", "to": "and_cd", "toNode": "inp[1]"},
    {"from": "and_ab", "fromNode": "output1", "to": "or_gate", "toNode": "inp[0]"},
    {"from": "and_cd", "fromNode": "output1", "to": "not_cd", "toNode": "inp1"},
    {"from": "not_cd", "fromNode": "output1", "to": "or_gate", "toNode": "inp[1]"},
    {"from": "or_gate", "fromNode": "output1", "to": "output_y", "toNode": "inp1"}
  ]
}

EXAMPLE 2 - Full Adder Circuit:
{
  "name": "Full Adder",
  "description": "Full Adder using Adder component",
  "elements": [
    {"id": "input_a", "type": "Input", "label": "A"},
    {"id": "input_b", "type": "Input", "label": "B"},
    {"id": "input_cin", "type": "Input", "label": "Cin"},
    {"id": "adder", "type": "Adder", "label": "FA", "labelDirection": "UP"},
    {"id": "output_sum", "type": "Output", "label": "Sum"},
    {"id": "output_cout", "type": "Output", "label": "Cout"}
  ],
  "connections": [
    {"from": "input_a", "fromNode": "output1", "to": "adder", "toNode": "inpA"},
    {"from": "input_b", "fromNode": "output1", "to": "adder", "toNode": "inpB"},
    {"from": "input_cin", "fromNode": "output1", "to": "adder", "toNode": "carryIn"},
    {"from": "adder", "fromNode": "sum", "to": "output_sum", "toNode": "inp1"},
    {"from": "adder", "fromNode": "carryOut", "to": "output_cout", "toNode": "inp1"}
  ]
}

EXAMPLE 3 - "Boolean Expression using 4:1 Multiplexer: F = x'y + xy' + xz":
SPECIAL CASE: When implementing Boolean expressions with MUX, use truth table method:
- For 4:1 MUX with 3 variables (x, y, z): Use 2 vars (x, y) as control/select lines, 1 var (z) for data inputs
- Build truth table, group by control lines (x y), derive data inputs from output column
- Control signal [x y] connects to BOTTOM of multiplexer (controlSignalInput)

Truth table analysis for F = x'y + xy' + xz:
x y z | F     → Group by xy (control signal value)
0 0 0 | 0       xy=00 (decimal 0): F=0 → inp[0] = 0
0 0 1 | 0    
0 1 0 | 1       xy=01 (decimal 1): F=1 → inp[1] = 1
0 1 1 | 1
1 0 0 | 1       xy=10 (decimal 2): F=1 → inp[2] = 1
1 0 1 | 1
1 1 0 | 0       xy=11 (decimal 3): F=z → inp[3] = z
1 1 1 | 1

Result: Data input mapping
- inp[0] connects to 0 (when xy=00)
- inp[1] connects to 1 (when xy=01)
- inp[2] connects to 1 (when xy=10)
- inp[3] connects to z (when xy=11)

{
  "name": "Boolean Expression using MUX",
  "description": "F = x'y + xy' + xz using 4:1 Multiplexer",
  "elements": [
    {"id": "input_xy", "type": "Input", "label": "x y", "properties": {"bitWidth": 2, "direction": "RIGHT"}},
    {"id": "input_z", "type": "Input", "label": "z", "properties": {"direction": "RIGHT"}},
    {"id": "const_0", "type": "ConstantVal", "label": "0", "properties": {"bitWidth": 1, "state": "0"}},
    {"id": "const_1a", "type": "ConstantVal", "label": "1", "properties": {"bitWidth": 1, "state": "1"}},
    {"id": "const_1b", "type": "ConstantVal", "label": "1", "properties": {"bitWidth": 1, "state": "1"}},
    {"id": "mux", "type": "Multiplexer", "label": "MUX", "labelDirection": "UP", "properties": {"controlSignalSize": 2, "bitWidth": 1}},
    {"id": "output_f", "type": "Output", "label": "F"}
  ],
  "connections": [
    {"from": "input_xy", "fromNode": "output1", "to": "mux", "toNode": "controlSignalInput"},
    {"from": "const_0", "fromNode": "output1", "to": "mux", "toNode": "inp[0]"},
    {"from": "const_1a", "fromNode": "output1", "to": "mux", "toNode": "inp[1]"},
    {"from": "const_1b", "fromNode": "output1", "to": "mux", "toNode": "inp[2]"},
    {"from": "input_z", "fromNode": "output1", "to": "mux", "toNode": "inp[3]"},
    {"from": "mux", "fromNode": "output1", "to": "output_f", "toNode": "inp1"}
  ]
}

ALTERNATIVE: If z' (NOT z) is needed in mux inputs like [0, 1, z, z']:
{
  "name": "Boolean with Inverted Variable",
  "description": "Example with z and z' inputs",
  "elements": [
    {"id": "input_xy", "type": "Input", "label": "x y", "properties": {"bitWidth": 2}},
    {"id": "input_z", "type": "Input", "label": "z"},
    {"id": "not_z", "type": "NotGate", "label": "NOT", "labelDirection": "UP"},
    {"id": "const_0", "type": "ConstantVal", "label": "0", "properties": {"bitWidth": 1}},
    {"id": "const_1", "type": "ConstantVal", "label": "1", "properties": {"bitWidth": 1}},
    {"id": "mux", "type": "Multiplexer", "label": "MUX", "labelDirection": "UP", "properties": {"controlSignalSize": 2, "bitWidth": 1}},
    {"id": "output_f", "type": "Output", "label": "F"}
  ],
  "connections": [
    {"from": "input_z", "fromNode": "output1", "to": "not_z", "toNode": "inp1"},
    {"from": "const_0", "fromNode": "output1", "to": "mux", "toNode": "inp[0]"},
    {"from": "const_1", "fromNode": "output1", "to": "mux", "toNode": "inp[1]"},
    {"from": "input_z", "fromNode": "output1", "to": "mux", "toNode": "inp[2]"},
    {"from": "not_z", "fromNode": "output1", "to": "mux", "toNode": "inp[3]"},
    {"from": "input_xy", "fromNode": "output1", "to": "mux", "toNode": "controlSignalInput"},
    {"from": "mux", "fromNode": "output1", "to": "output_f", "toNode": "inp1"}
  ]
}

CRITICAL MULTIPLEXER RULES FOR BOOLEAN EXPRESSIONS:
1. **Control Signal**: Single input with bitWidth=n for n select bits (bitWidth=2 for 4:1 mux)
2. **Multiplexer properties**: 
   - controlSignalSize: 2 (for 4:1), 3 (for 8:1) - this auto-creates 2^n inputs
   - bitWidth: 1 (single bit data)
   - DO NOT set inputLength - it's calculated from controlSignalSize
3. **Data inputs [inp[0] to inp[3]]**: Analyze truth table last column grouped by select bits
   - Can be: ConstantVal(0), ConstantVal(1), variable (z), or inverted (z' via NotGate)
4. **Input labels**: Use "x y" for 2-bit select, "x y z" for 3-bit, etc.
5. **Truth table method**: Group rows by select variables, check if output is constant (0/1) or depends on remaining variable

CONNECTION RULES - ENSURE ALL ELEMENTS ARE CONNECTED:
1. Every Input must connect to at least one gate input
2. Every gate output1 must connect to another gate input or Output inp1
3. For expressions like (AB)':
   - A connects to AndGate inp[0]
   - B connects to AndGate inp[1]
   - AndGate output1 connects to NotGate inp1  ← CRITICAL: NotGate uses inp1, not inp[0]!
   - NotGate output1 connects to next stage
4. Every element in "elements" array must appear in "connections" array
5. Double-check that intermediate gates (like AND before NOT) are properly connected

INSTRUCTIONS:
1. Analyze the request and choose appropriate components
2. List ALL elements needed (inputs, gates, output)
3. Create ALL connections - verify each element output connects somewhere
4. For inverted sub-expressions: gate → NOT gate → next stage (3 connections minimum)
5. Return ONLY the JSON object, no markdown, no explanations

Generate the circuit JSON for: ${description}`;

    const completion = await textChat(prompt, false, 0.3); // Low temperature for consistent JSON
    const response = completion.choices[0]?.message?.content || '';
    
    console.log('Raw AI response length:', response.length, 'chars');
    console.log('Raw AI response:', response.substring(0, 500) + (response.length > 500 ? '...' : ''));
    
    // Try to parse JSON from response - improved extraction
    try {
      let jsonStr = response.trim();
      
      // Check if response is empty
      if (!jsonStr) {
        throw new Error('AI returned empty response');
      }
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Remove any leading/trailing text before/after JSON
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        console.error('Could not find JSON object boundaries in response');
        throw new Error('No JSON object found in response');
      }
      
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      
      console.log('Extracted JSON string:', jsonStr);
      
      const circuitJSON = JSON.parse(jsonStr);
      
      // Validate required fields
      if (!circuitJSON.elements || !Array.isArray(circuitJSON.elements)) {
        throw new Error('Invalid circuit JSON: missing elements array');
      }
      
      if (!circuitJSON.connections || !Array.isArray(circuitJSON.connections)) {
        throw new Error('Invalid circuit JSON: missing connections array');
      }
      
      console.log('✓ Successfully parsed circuit with', circuitJSON.elements.length, 'elements and', circuitJSON.connections.length, 'connections');
      
      res.json({
        success: true,
        circuit: circuitJSON,
        rawResponse: response
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Failed to parse response:', response);
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
