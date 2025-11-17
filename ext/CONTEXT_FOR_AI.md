# Circuit Generation Context for AI Models

This document provides context for Large Language Models (LLMs) to generate circuit definitions in JSON format that can be automatically created and wired in CircuitVerse using the Chrome extension.

## Overview

The CircuitVerse Circuit Builder Chrome Extension can automatically create and wire circuit elements. AI models can generate JSON definitions that describe circuits, which are then executed by the `createCircuitFromJSON()` function.

## Available Elements

### Input Elements
- `Input` - Basic input (default direction: RIGHT)
- `Button` - Push button input
- `Power` - Constant 1
- `Ground` - Constant 0
- `ConstantVal` - Configurable constant
- `Stepper` - Step through values
- `Random` - Random value generator
- `Counter` - Counter element

### Logic Gates (default direction: RIGHT, default inputLength: 2)
- `AndGate` - AND gate (supports 2+ inputs)
- `OrGate` - OR gate (supports 2+ inputs)
- `NotGate` - NOT gate (single input only)
- `NandGate` - NAND gate (supports 2+ inputs)
- `NorGate` - NOR gate (supports 2+ inputs)
- `XorGate` - XOR gate (supports 2+ inputs)
- `XnorGate` - XNOR gate (supports 2+ inputs)

**Important**: Most gates support MORE than 2 inputs! Use the `inputLength` property to specify how many inputs the gate should have. For example, a 3-input AND gate would have nodes `inp[0]`, `inp[1]`, and `inp[2]`.

### Output Elements (default direction: LEFT)
- `Output` - Basic output display
- `DigitalLed` - LED display
- `RGBLed` - RGB LED
- `SquareRGBLed` - Square RGB LED
- `HexDisplay` - Hexadecimal display
- `SevenSegDisplay` - 7-segment display
- `SixteenSegDisplay` - 16-segment display

### Other Elements
- `Multiplexer` - MUX (default inputLength: 2)
- `Demultiplexer` - DEMUX (default inputLength: 2)
- `Splitter` - Signal splitter
- `Adder` - Adder circuit
- `Clock` - Clock signal
- `DflipFlop` - D Flip-flop
- `TflipFlop` - T Flip-flop
- `JKflipFlop` - JK Flip-flop
- `SRflipFlop` - SR Flip-flop
- `RAM` - RAM module
- `ROM` - ROM module

## JSON Circuit Definition Schema

```json
{
  "name": "Circuit Name",
  "description": "Brief description of what the circuit does",
  "elements": [
    {
      "id": "unique_element_id",
      "type": "ElementType",
      "label": "Label Text (optional)",
      "labelDirection": "UP|DOWN|LEFT|RIGHT (optional, default varies by element)",
      "properties": {
        "inputLength": 2,
        "bitWidth": 1
      }
    }
  ],
  "connections": [
    {
      "from": "source_element_id",
      "fromNode": "output1 or inp[0] etc",
      "to": "target_element_id",
      "toNode": "inp1 or inp[0] etc"
    }
  ]
}
```

## Element Node Reference

### Common Output Nodes
- **Input elements**: `output1` - Main output node
- **Gates**: `output1` - Output of the gate
- **Flip-flops**: `qOutput`, `qInvOutput` - Q and Q̄ outputs

### Common Input Nodes
- **Output elements**: `inp1` - Main input node
- **Gates with multiple inputs**: `inp[0]`, `inp[1]`, `inp[2]`, etc.
- **NotGate**: `inp1` - Single input
- **Flip-flops**: Various (D, T, J, K, S, R, clock, etc.)

### Determining Node Names
To find exact node names for any element, refer to:
`CircuitVerse-master/simulator/src/modules/<ElementType>.js`

Common patterns:
- Single input elements: `inp1`
- Multiple input elements: `inp` array indexed as `inp[0]`, `inp[1]`, etc.
- Single output elements: `output1`
- Flip-flops with Q outputs: `qOutput`, `qInvOutput`

## Label Guidelines

### Input Elements
- Use alphabetic labels: A, B, C, D, etc.
- Keep labels short (1-3 characters)

### Gates
- Use simple gate type labels: AND, OR, NOT, NAND, NOR, XOR, XNOR
- **DO NOT add numbers** to gate labels (use "OR", not "OR1", "OR2", etc.)
- If multiple gates of same type exist, they all get the same label (e.g., all OR gates labeled "OR")
- Set `labelDirection` to "UP" for gates (displays above the element)

### Output Elements
- Use result labels: X only
- Or descriptive: SUM, CARRY, DIFF, etc.

### Label Direction
- **UP**: Best for gates (label appears above)
- **RIGHT**: Default for most elements
- **LEFT**: Good for outputs on right side
- **DOWN**: Good for elements with vertical space

## Example JSON Circuits

### Example 1: Simple AND Gate
```json
{
  "name": "Simple AND Gate",
  "description": "Two inputs connected to an AND gate with output",
  "elements": [
    {
      "id": "input_a",
      "type": "Input",
      "label": "A"
    },
    {
      "id": "input_b",
      "type": "Input",
      "label": "B"
    },
    {
      "id": "and_gate",
      "type": "AndGate",
      "label": "AND",
      "labelDirection": "UP"
    },
    {
      "id": "output_x",
      "type": "Output",
      "label": "X"
    }
  ],
  "connections": [
    {
      "from": "input_a",
      "fromNode": "output1",
      "to": "and_gate",
      "toNode": "inp[0]"
    },
    {
      "from": "input_b",
      "fromNode": "output1",
      "to": "and_gate",
      "toNode": "inp[1]"
    },
    {
      "from": "and_gate",
      "fromNode": "output1",
      "to": "output_x",
      "toNode": "inp1"
    }
  ]
}
```

### Example 2: Half Adder
```json
{
  "name": "Half Adder",
  "description": "Adds two single-bit binary numbers, producing sum and carry",
  "elements": [
    {
      "id": "input_a",
      "type": "Input",
      "label": "A"
    },
    {
      "id": "input_b",
      "type": "Input",
      "label": "B"
    },
    {
      "id": "xor_sum",
      "type": "XorGate",
      "label": "XOR",
      "labelDirection": "UP"
    },
    {
      "id": "and_carry",
      "type": "AndGate",
      "label": "AND",
      "labelDirection": "UP"
    },
    {
      "id": "output_sum",
      "type": "Output",
      "label": "SUM"
    },
    {
      "id": "output_carry",
      "type": "Output",
      "label": "CARRY"
    }
  ],
  "connections": [
    {
      "from": "input_a",
      "fromNode": "output1",
      "to": "xor_sum",
      "toNode": "inp[0]"
    },
    {
      "from": "input_b",
      "fromNode": "output1",
      "to": "xor_sum",
      "toNode": "inp[1]"
    },
    {
      "from": "input_a",
      "fromNode": "output1",
      "to": "and_carry",
      "toNode": "inp[0]"
    },
    {
      "from": "input_b",
      "fromNode": "output1",
      "to": "and_carry",
      "toNode": "inp[1]"
    },
    {
      "from": "xor_sum",
      "fromNode": "output1",
      "to": "output_sum",
      "toNode": "inp1"
    },
    {
      "from": "and_carry",
      "fromNode": "output1",
      "to": "output_carry",
      "toNode": "inp1"
    }
  ]
}
```

### Example 3: Multi-Input Gate - (A+B)*(C+D)*(E+F)
```json
{
  "name": "Product of Three Sums",
  "description": "Computes (A+B)*(C+D)*(E+F) using one 3-input AND gate",
  "elements": [
    {
      "id": "input_a",
      "type": "Input",
      "label": "A"
    },
    {
      "id": "input_b",
      "type": "Input",
      "label": "B"
    },
    {
      "id": "input_c",
      "type": "Input",
      "label": "C"
    },
    {
      "id": "input_d",
      "type": "Input",
      "label": "D"
    },
    {
      "id": "input_e",
      "type": "Input",
      "label": "E"
    },
    {
      "id": "input_f",
      "type": "Input",
      "label": "F"
    },
    {
      "id": "or_ab",
      "type": "OrGate",
      "label": "OR",
      "labelDirection": "UP"
    },
    {
      "id": "or_cd",
      "type": "OrGate",
      "label": "OR",
      "labelDirection": "UP"
    },
    {
      "id": "or_ef",
      "type": "OrGate",
      "label": "OR",
      "labelDirection": "UP"
    },
    {
      "id": "and_gate",
      "type": "AndGate",
      "label": "AND",
      "labelDirection": "UP",
      "properties": {
        "inputLength": 3
      }
    },
    {
      "id": "output_result",
      "type": "Output",
      "label": "RESULT"
    }
  ],
  "connections": [
    {
      "from": "input_a",
      "fromNode": "output1",
      "to": "or_ab",
      "toNode": "inp[0]"
    },
    {
      "from": "input_b",
      "fromNode": "output1",
      "to": "or_ab",
      "toNode": "inp[1]"
    },
    {
      "from": "input_c",
      "fromNode": "output1",
      "to": "or_cd",
      "toNode": "inp[0]"
    },
    {
      "from": "input_d",
      "fromNode": "output1",
      "to": "or_cd",
      "toNode": "inp[1]"
    },
    {
      "from": "input_e",
      "fromNode": "output1",
      "to": "or_ef",
      "toNode": "inp[0]"
    },
    {
      "from": "input_f",
      "fromNode": "output1",
      "to": "or_ef",
      "toNode": "inp[1]"
    },
    {
      "from": "or_ab",
      "fromNode": "output1",
      "to": "and_gate",
      "toNode": "inp[0]"
    },
    {
      "from": "or_cd",
      "fromNode": "output1",
      "to": "and_gate",
      "toNode": "inp[1]"
    },
    {
      "from": "or_ef",
      "fromNode": "output1",
      "to": "and_gate",
      "toNode": "inp[2]"
    },
    {
      "from": "and_gate",
      "fromNode": "output1",
      "to": "output_result",
      "toNode": "inp1"
    }
  ]
}
```

### Example 4: SR Latch
```json
{
  "name": "SR Latch",
  "description": "Set-Reset latch using NOR gates",
  "elements": [
    {
      "id": "input_s",
      "type": "Input",
      "label": "S"
    },
    {
      "id": "input_r",
      "type": "Input",
      "label": "R"
    },
    {
      "id": "nor1",
      "type": "NorGate",
      "label": "NOR1",
      "labelDirection": "UP"
    },
    {
      "id": "nor2",
      "type": "NorGate",
      "label": "NOR2",
      "labelDirection": "UP"
    },
    {
      "id": "output_q",
      "type": "Output",
      "label": "Q"
    },
    {
      "id": "output_qbar",
      "type": "Output",
      "label": "Q̄"
    }
  ],
  "connections": [
    {
      "from": "input_s",
      "fromNode": "output1",
      "to": "nor1",
      "toNode": "inp[0]"
    },
    {
      "from": "nor2",
      "fromNode": "output1",
      "to": "nor1",
      "toNode": "inp[1]"
    },
    {
      "from": "input_r",
      "fromNode": "output1",
      "to": "nor2",
      "toNode": "inp[0]"
    },
    {
      "from": "nor1",
      "fromNode": "output1",
      "to": "nor2",
      "toNode": "inp[1]"
    },
    {
      "from": "nor1",
      "fromNode": "output1",
      "to": "output_q",
      "toNode": "inp1"
    },
    {
      "from": "nor2",
      "fromNode": "output1",
      "to": "output_qbar",
      "toNode": "inp1"
    }
  ]
}
```

## Rules for AI Circuit Generation

1. **Element IDs**: Use descriptive snake_case IDs (e.g., `input_a`, `and_gate_1`, `output_sum`)

2. **Input Ordering**: For gates with multiple inputs:
   - First input: `inp[0]`
   - Second input: `inp[1]`
   - Third input: `inp[2]`, etc.

3. **Labels**: 
   - Always provide labels for inputs and outputs
   - Label gates with their type only (AND, OR, XOR, etc.)
   - DO NOT add numbers to gate labels (use "OR", not "OR1")
   - Use uppercase for consistency

4. **Label Direction**:
   - Set to "UP" for all gates
   - Can be omitted for inputs/outputs (uses defaults)

5. **Connections**:
   - List all connections from left to right (inputs → gates → outputs)
   - Include feedback connections for sequential circuits
   - Verify node names match element types

6. **Element Properties**:
   - `inputLength`: Number of inputs for gates (default: 2, can be 2-8 or more)
   - `bitWidth`: Bit width for signals (default: 1)
   - Omit if using defaults
   - **IMPORTANT**: Use multi-input gates when appropriate (e.g., 3-input AND instead of cascading 2-input ANDs)

7. **Circuit Flow**:
   - Inputs should be on the left
   - Processing (gates) in the middle
   - Outputs on the right
   - The auto-layout positions them accordingly

## AI Prompt Template

When asking an AI to generate a circuit:

```
Generate a CircuitVerse circuit JSON definition for [CIRCUIT_NAME] that [DESCRIPTION].

Requirements:
- Use element types from: Input, AndGate, OrGate, NotGate, XorGate, NandGate, NorGate, XnorGate, Output
- Label all inputs as A, B, C, etc.
- Label all gates with their type (AND, OR, etc.) and set labelDirection to "UP"
- Label outputs as meaningful names (SUM, CARRY, X, Y, etc.)
- Use snake_case for element IDs
- Define all connections with correct node names (output1, inp1, inp[0], inp[1], etc.)
- **USE MULTI-INPUT GATES**: If you need to AND/OR more than 2 signals, use inputLength property (e.g., 3-input AND) instead of cascading gates
- Follow the JSON schema provided in CONTEXT_FOR_AI.md

Return ONLY the JSON without any markdown formatting or explanations.
```

## Function Usage

Once you have the JSON, use it in the browser console:

```javascript
// The circuit JSON (from AI)
const circuitJSON = {
  "name": "Your Circuit",
  "elements": [...],
  "connections": [...]
};

// Create the circuit
createCircuitFromJSON(JSON.stringify(circuitJSON));

// Or load from a file/string
createCircuitFromJSON('{"name":"Circuit",...}');
```

## Technical Notes

### Element Creation
- Elements are created asynchronously
- Constructor parameters vary by element type
- Position is auto-calculated based on category
- Elements are stored with unique IDs for wiring

### Wire Connections
- Uses CircuitVerse's `node.connect()` method
- Creates visual wires automatically
- Handles array notation for multi-input elements
- Validates nodes before connecting

### Auto-Layout
- **Input** category: x=50, y=50, spacing=50px
- **Gates** category: x=225, y=50, spacing=50px
- **Output** category: x=400, y=50, spacing=50px
- Auto-wraps at y>500, shifts x by 100px

### Centering
- Automatically calls `menuItemClicked(7)` after circuit creation
- Centers viewport on the created circuit

## Error Handling

Common errors and solutions:

1. **"Element not found"**: Check element type spelling matches exactly
2. **"Node not found"**: Verify node name (output1 vs inp1 vs inp[0])
3. **"Connection failed"**: Ensure source element has output and target has input
4. **"Invalid JSON"**: Validate JSON syntax before passing to function

## Best Practices

1. Start simple - test with basic gates first
2. Verify node names from CircuitVerse source files if uncertain
3. Use meaningful labels for clarity
4. Keep circuits modular and readable
5. Test connections incrementally for complex circuits
6. Use consistent naming conventions
7. Document complex circuits in the description field

## Additional Resources

- CircuitVerse documentation: https://docs.circuitverse.org/
- Element source code: `CircuitVerse-master/simulator/src/modules/`
- Circuit elements reference: `circuit-elements.json`
