# Circuit Generation Context for AI Models

This document provides context for Large Language Models (LLMs) to generate circuit definitions in JSON format that can be automatically created and wired in CircuitVerse using the Chrome extension.

## CRITICAL: Use Pre-Built Components!

**ALWAYS use pre-built components instead of building from basic gates when available.**

| User Request | USE THIS | NOT This |
|--------------|----------|----------|
| "full adder", "adder", "add numbers" | `Adder` component | XOR + AND + OR gates |
| "subtract", "ALU", "arithmetic" | `ALU` component | Multiple gates |
| "multiply" | `verilogMultiplier` | Shift-and-add circuits |
| "mux", "select", "choose input" | `Multiplexer` | Gate-based selector |
| "demux", "route to output" | `Demultiplexer` | Multiple AND gates |
| "decoder" | `Decoder` | Gate-based decoder |
| "D flip-flop", "register" | `DflipFlop` | NOR gate latch |
| "counter" | `Counter` | Cascaded flip-flops |
| "memory", "RAM" | `RAM` | Array of flip-flops |

**Only use basic gates (AndGate, OrGate, etc.) when:**
- User explicitly asks for gate-level implementation
- Custom logic expressions (e.g., "A AND B OR C")
- Educational circuits showing how components work internally

---

## JSON Circuit Definition Schema

```json
{
  "name": "Circuit Name",
  "description": "Brief description of what the circuit does",
  "elements": [
    {
      "id": "unique_element_id",
      "type": "ElementType",
      "label": "Label Text",
      "labelDirection": "UP|DOWN|LEFT|RIGHT",
      "properties": {
        "bitWidth": 1,
        "inputLength": 2
      }
    }
  ],
  "connections": [
    {
      "from": "source_element_id",
      "fromNode": "output_node_name",
      "to": "target_element_id",
      "toNode": "input_node_name"
    }
  ]
}
```

---

## Complete Component Reference

### INPUT COMPONENTS

| Component | Type | Output Node | Properties | Description |
|-----------|------|-------------|------------|-------------|
| Input | `Input` | `output1` | `bitWidth` (default: 1) | Standard input pin |
| Button | `Button` | `output1` | - | Push button (momentary) |
| Power | `Power` | `output1` | - | Constant HIGH (1) |
| Ground | `Ground` | `output1` | - | Constant LOW (0) |
| ConstantVal | `ConstantVal` | `output1` | `bitWidth`, `value` | User-defined constant |
| Stepper | `Stepper` | `output1` | `bitWidth` | Step through values |
| Random | `Random` | `output1` | `bitWidth` | Random value generator |
| Counter | `Counter` | `output1` | `bitWidth` | Incrementing counter |

### OUTPUT COMPONENTS

| Component | Type | Input Node | Properties | Description |
|-----------|------|------------|------------|-------------|
| Output | `Output` | `inp1` | `bitWidth` (default: 1) | Standard output display |
| DigitalLed | `DigitalLed` | `inp1` | - | Single LED indicator |
| RGBLed | `RGBLed` | `inp[0]`, `inp[1]`, `inp[2]` | - | RGB LED (R, G, B inputs) |
| SquareRGBLed | `SquareRGBLed` | `inp[0]`, `inp[1]`, `inp[2]` | - | Square RGB LED |
| HexDisplay | `HexDisplay` | `inp1` | - | Hexadecimal display |
| SevenSegDisplay | `SevenSegDisplay` | `a`-`g`, `dp` | - | 7-segment display |
| SixteenSegDisplay | `SixteenSegDisplay` | multiple | - | 16-segment display |
| VariableLed | `VariableLed` | `inp1` | - | Variable brightness LED |

### LOGIC GATES

| Component | Type | Input Nodes | Output Node | Properties |
|-----------|------|-------------|-------------|------------|
| AND Gate | `AndGate` | `inp[0]`, `inp[1]`, ... | `output1` | `inputLength` (2-10), `bitWidth` |
| OR Gate | `OrGate` | `inp[0]`, `inp[1]`, ... | `output1` | `inputLength` (2-10), `bitWidth` |
| NOT Gate | `NotGate` | `inp1` | `output1` | `bitWidth` |
| NAND Gate | `NandGate` | `inp[0]`, `inp[1]`, ... | `output1` | `inputLength` (2-10), `bitWidth` |
| NOR Gate | `NorGate` | `inp[0]`, `inp[1]`, ... | `output1` | `inputLength` (2-10), `bitWidth` |
| XOR Gate | `XorGate` | `inp[0]`, `inp[1]`, ... | `output1` | `inputLength` (2-10), `bitWidth` |
| XNOR Gate | `XnorGate` | `inp[0]`, `inp[1]`, ... | `output1` | `inputLength` (2-10), `bitWidth` |

**Note**: Multi-input gates use array notation: `inp[0]`, `inp[1]`, `inp[2]`, etc.

### DECODERS & MULTIPLEXERS

| Component | Type | Input Nodes | Output Nodes | Properties |
|-----------|------|-------------|--------------|------------|
| Multiplexer | `Multiplexer` | `inp[0]`, `inp[1]`, ..., `controlSignalInput` | `output1` | `controlSignalSize` (1-10), `bitWidth` |
| Demultiplexer | `Demultiplexer` | `input`, `controlSignalInput` | `output1[0]`, `output1[1]`, ... | `controlSignalSize`, `bitWidth` |
| Decoder | `Decoder` | `input` | `output1[0]`, `output1[1]`, ... | `bitWidth` (determines outputs: 2^bitWidth) |
| PriorityEncoder | `PriorityEncoder` | `inp[0]`, `inp[1]`, ... | `output` | `bitWidth` |
| BitSelector | `BitSelector` | `inp`, `sel` | `output1` | `bitWidth` |
| MSB | `MSB` | `inp` | `output1` | `bitWidth` |
| LSB | `LSB` | `inp` | `output1` | `bitWidth` |

**Important - Decoder/Demultiplexer Positioning:**
- The extension automatically handles proper positioning for Decoder and Demultiplexer
- For these components, Input elements are placed on the RIGHT and Output elements on the LEFT
- This matches how CircuitVerse draws these components (input node on right side, output nodes on left side)
- No special properties needed - just define connections normally

**Decoder Details:**
- `bitWidth` determines the input size and number of outputs
- bitWidth=1 → 1-bit input, 2 outputs (output1[0], output1[1]) - 1:2 decoder
- bitWidth=2 → 2-bit input, 4 outputs (output1[0] to output1[3]) - 2:4 decoder
- bitWidth=3 → 3-bit input, 8 outputs (output1[0] to output1[7]) - 3:8 decoder
- Formula: outputs = 2^bitWidth

**Multiplexer Details:**
- `controlSignalSize` determines number of data inputs: 2^controlSignalSize inputs
- controlSignalSize=1 → 2 inputs (inp[0], inp[1])
- controlSignalSize=2 → 4 inputs (inp[0], inp[1], inp[2], inp[3])

### SEQUENTIAL ELEMENTS

| Component | Type | Input Nodes | Output Nodes | Properties |
|-----------|------|-------------|--------------|------------|
| D Flip-Flop | `DflipFlop` | `dInp`, `clockInp`, `reset`, `preset`, `en` | `qOutput`, `qInvOutput` | `bitWidth` |
| T Flip-Flop | `TflipFlop` | `tInp`, `clockInp`, `reset`, `preset`, `en` | `qOutput`, `qInvOutput` | `bitWidth` |
| JK Flip-Flop | `JKflipFlop` | `jInp`, `kInp`, `clockInp`, `reset`, `preset`, `en` | `qOutput`, `qInvOutput` | `bitWidth` |
| SR Flip-Flop | `SRflipFlop` | `sInp`, `rInp`, `clockInp`, `reset`, `preset`, `en` | `qOutput`, `qInvOutput` | `bitWidth` |
| D Latch | `Dlatch` | `dInp`, `en` | `qOutput`, `qInvOutput` | `bitWidth` |
| Clock | `Clock` | - | `output1` | - |

### MEMORY COMPONENTS

| Component | Type | Input Nodes | Output Nodes | Properties |
|-----------|------|-------------|--------------|------------|
| RAM | `RAM` | `address`, `dataIn`, `write`, `reset`, `coreDump` | `dataOut` | `addressWidth` (1-20), `bitWidth` (1-32) |
| ROM | `ROM` | `address` | `dataOut` | `addressWidth`, `bitWidth` |
| EEPROM | `EEPROM` | `address`, `dataIn`, `write` | `dataOut` | `addressWidth`, `bitWidth` |

### ARITHMETIC COMPONENTS (USE THESE!)

#### Adder (IMPORTANT - Use for addition!)
| Property | Value |
|----------|-------|
| Type | `Adder` |
| Input Nodes | `inpA` (n-bit), `inpB` (n-bit), `carryIn` (1-bit) |
| Output Nodes | `sum` (n-bit), `carryOut` (1-bit) |
| Properties | `bitWidth` (default: 1) |

**Example - Full Adder using Adder component:**
```json
{
  "name": "Full Adder",
  "description": "Full adder using pre-built Adder component",
  "elements": [
    {"id": "input_a", "type": "Input", "label": "A"},
    {"id": "input_b", "type": "Input", "label": "B"},
    {"id": "input_cin", "type": "Input", "label": "CIN"},
    {"id": "adder", "type": "Adder", "label": "ADDER", "labelDirection": "UP"},
    {"id": "output_sum", "type": "Output", "label": "SUM"},
    {"id": "output_cout", "type": "Output", "label": "COUT"}
  ],
  "connections": [
    {"from": "input_a", "fromNode": "output1", "to": "adder", "toNode": "inpA"},
    {"from": "input_b", "fromNode": "output1", "to": "adder", "toNode": "inpB"},
    {"from": "input_cin", "fromNode": "output1", "to": "adder", "toNode": "carryIn"},
    {"from": "adder", "fromNode": "sum", "to": "output_sum", "toNode": "inp1"},
    {"from": "adder", "fromNode": "carryOut", "to": "output_cout", "toNode": "inp1"}
  ]
}
```

#### ALU (Arithmetic Logic Unit)
| Property | Value |
|----------|-------|
| Type | `ALU` |
| Input Nodes | `inp1` (A), `inp2` (B), `controlSignalInput` (3-bit) |
| Output Nodes | `output` (result), `carryOut` |
| Properties | `bitWidth` (default: 1) |

**ALU Control Codes:**
| Control | Operation |
|---------|-----------|
| 0 | A & B (AND) |
| 1 | A \| B (OR) |
| 2 | A + B (ADD) |
| 4 | A & ~B |
| 5 | A \| ~B |
| 6 | A - B (SUBTRACT) |
| 7 | A < B (Set Less Than) |

#### Other Arithmetic Components
| Component | Type | Input Nodes | Output Nodes | Properties |
|-----------|------|-------------|--------------|------------|
| Two's Complement | `TwoComplement` | `inp` | `output1` | `bitWidth` |
| Multiplier | `verilogMultiplier` | `inp1`, `inp2` | `product` | `bitWidth` |
| Divider | `verilogDivider` | `inp1`, `inp2` | `quotient`, `remainder` | `bitWidth` |
| Power | `verilogPower` | `inp1`, `inp2` | `output` | `bitWidth` |
| Shift Left | `verilogShiftLeft` | `inp`, `shiftAmt` | `output` | `bitWidth` |
| Shift Right | `verilogShiftRight` | `inp`, `shiftAmt` | `output` | `bitWidth` |

### UTILITY COMPONENTS

| Component | Type | Input Nodes | Output Nodes | Properties |
|-----------|------|-------------|--------------|------------|
| Buffer | `Buffer` | `inp1` | `output1` | `bitWidth` |
| Tri-State | `TriState` | `inp`, `enable` | `output1` | `bitWidth` |
| Controlled Inverter | `ControlledInverter` | `inp`, `control` | `output1` | `bitWidth` |
| Splitter | `Splitter` | varies | varies | `bitWidth`, `bitWidthSplit` |
| Tunnel | `Tunnel` | `inp1` | `output1` | `identifier` |
| Flag | `Flag` | `inp1` | - | - |

### ANNOTATION COMPONENTS

| Component | Type | Description |
|-----------|------|-------------|
| Text | `Text` | Add text labels |
| Rectangle | `Rectangle` | Visual grouping |
| Arrow | `Arrow` | Visual indicators |
| ImageAnnotation | `ImageAnnotation` | Embed images |

---

## Multi-Bit Circuit Examples

### Example: 4-bit Adder
```json
{
  "name": "4-bit Adder",
  "description": "Adds two 4-bit numbers with carry",
  "elements": [
    {"id": "input_a", "type": "Input", "label": "A", "properties": {"bitWidth": 4}},
    {"id": "input_b", "type": "Input", "label": "B", "properties": {"bitWidth": 4}},
    {"id": "input_cin", "type": "Input", "label": "CIN"},
    {"id": "adder", "type": "Adder", "label": "ADDER", "labelDirection": "UP", "properties": {"bitWidth": 4}},
    {"id": "output_sum", "type": "Output", "label": "SUM", "properties": {"bitWidth": 4}},
    {"id": "output_cout", "type": "Output", "label": "COUT"}
  ],
  "connections": [
    {"from": "input_a", "fromNode": "output1", "to": "adder", "toNode": "inpA"},
    {"from": "input_b", "fromNode": "output1", "to": "adder", "toNode": "inpB"},
    {"from": "input_cin", "fromNode": "output1", "to": "adder", "toNode": "carryIn"},
    {"from": "adder", "fromNode": "sum", "to": "output_sum", "toNode": "inp1"},
    {"from": "adder", "fromNode": "carryOut", "to": "output_cout", "toNode": "inp1"}
  ]
}
```

### Example: 4:1 Multiplexer
```json
{
  "name": "4:1 Multiplexer",
  "description": "Selects one of 4 inputs based on 2-bit control signal",
  "elements": [
    {"id": "input_0", "type": "Input", "label": "D0"},
    {"id": "input_1", "type": "Input", "label": "D1"},
    {"id": "input_2", "type": "Input", "label": "D2"},
    {"id": "input_3", "type": "Input", "label": "D3"},
    {"id": "sel", "type": "Input", "label": "SEL", "properties": {"bitWidth": 2}},
    {"id": "mux", "type": "Multiplexer", "label": "MUX", "labelDirection": "UP", "properties": {"controlSignalSize": 2}},
    {"id": "output", "type": "Output", "label": "Y"}
  ],
  "connections": [
    {"from": "input_0", "fromNode": "output1", "to": "mux", "toNode": "inp[0]"},
    {"from": "input_1", "fromNode": "output1", "to": "mux", "toNode": "inp[1]"},
    {"from": "input_2", "fromNode": "output1", "to": "mux", "toNode": "inp[2]"},
    {"from": "input_3", "fromNode": "output1", "to": "mux", "toNode": "inp[3]"},
    {"from": "sel", "fromNode": "output1", "to": "mux", "toNode": "controlSignalInput"},
    {"from": "mux", "fromNode": "output1", "to": "output", "toNode": "inp1"}
  ]
}
```

### Example: ALU Circuit (Addition)
```json
{
  "name": "ALU Addition",
  "description": "ALU performing A + B (control=2)",
  "elements": [
    {"id": "input_a", "type": "Input", "label": "A", "properties": {"bitWidth": 4}},
    {"id": "input_b", "type": "Input", "label": "B", "properties": {"bitWidth": 4}},
    {"id": "ctrl", "type": "ConstantVal", "label": "CTRL", "properties": {"bitWidth": 3}},
    {"id": "alu", "type": "ALU", "label": "ALU", "labelDirection": "UP", "properties": {"bitWidth": 4}},
    {"id": "output_result", "type": "Output", "label": "RESULT", "properties": {"bitWidth": 4}},
    {"id": "output_carry", "type": "Output", "label": "CARRY"}
  ],
  "connections": [
    {"from": "input_a", "fromNode": "output1", "to": "alu", "toNode": "inp1"},
    {"from": "input_b", "fromNode": "output1", "to": "alu", "toNode": "inp2"},
    {"from": "ctrl", "fromNode": "output1", "to": "alu", "toNode": "controlSignalInput"},
    {"from": "alu", "fromNode": "output", "to": "output_result", "toNode": "inp1"},
    {"from": "alu", "fromNode": "carryOut", "to": "output_carry", "toNode": "inp1"}
  ]
}
```

### Example: D Flip-Flop with Clock
```json
{
  "name": "D Flip-Flop",
  "description": "D Flip-Flop with clock input",
  "elements": [
    {"id": "input_d", "type": "Input", "label": "D"},
    {"id": "clock", "type": "Clock", "label": "CLK"},
    {"id": "dff", "type": "DflipFlop", "label": "DFF", "labelDirection": "UP"},
    {"id": "output_q", "type": "Output", "label": "Q"},
    {"id": "output_qbar", "type": "Output", "label": "Q'"}
  ],
  "connections": [
    {"from": "input_d", "fromNode": "output1", "to": "dff", "toNode": "dInp"},
    {"from": "clock", "fromNode": "output1", "to": "dff", "toNode": "clockInp"},
    {"from": "dff", "fromNode": "qOutput", "to": "output_q", "toNode": "inp1"},
    {"from": "dff", "fromNode": "qInvOutput", "to": "output_qbar", "toNode": "inp1"}
  ]
}
```

### Example: 2:4 Decoder
```json
{
  "name": "2:4 Decoder",
  "description": "2-bit input to 4-line output decoder",
  "elements": [
    {"id": "input_sel", "type": "Input", "label": "SEL", "properties": {"bitWidth": 2}},
    {"id": "decoder", "type": "Decoder", "label": "DEC", "labelDirection": "UP", "properties": {"bitWidth": 2}},
    {"id": "output_0", "type": "Output", "label": "Y0"},
    {"id": "output_1", "type": "Output", "label": "Y1"},
    {"id": "output_2", "type": "Output", "label": "Y2"},
    {"id": "output_3", "type": "Output", "label": "Y3"}
  ],
  "connections": [
    {"from": "input_sel", "fromNode": "output1", "to": "decoder", "toNode": "input"},
    {"from": "decoder", "fromNode": "output1[0]", "to": "output_0", "toNode": "inp1"},
    {"from": "decoder", "fromNode": "output1[1]", "to": "output_1", "toNode": "inp1"},
    {"from": "decoder", "fromNode": "output1[2]", "to": "output_2", "toNode": "inp1"},
    {"from": "decoder", "fromNode": "output1[3]", "to": "output_3", "toNode": "inp1"}
  ]
}
```

---

## Basic Gate Examples (Use only when necessary)

### Example: Simple AND Gate
```json
{
  "name": "Simple AND Gate",
  "description": "Two inputs connected to an AND gate",
  "elements": [
    {"id": "input_a", "type": "Input", "label": "A"},
    {"id": "input_b", "type": "Input", "label": "B"},
    {"id": "and_gate", "type": "AndGate", "label": "AND", "labelDirection": "UP"},
    {"id": "output_x", "type": "Output", "label": "X"}
  ],
  "connections": [
    {"from": "input_a", "fromNode": "output1", "to": "and_gate", "toNode": "inp[0]"},
    {"from": "input_b", "fromNode": "output1", "to": "and_gate", "toNode": "inp[1]"},
    {"from": "and_gate", "fromNode": "output1", "to": "output_x", "toNode": "inp1"}
  ]
}
```

### Example: 3-Input AND Gate
```json
{
  "name": "3-Input AND Gate",
  "description": "Three inputs connected to a single AND gate",
  "elements": [
    {"id": "input_a", "type": "Input", "label": "A"},
    {"id": "input_b", "type": "Input", "label": "B"},
    {"id": "input_c", "type": "Input", "label": "C"},
    {"id": "and_gate", "type": "AndGate", "label": "AND", "labelDirection": "UP", "properties": {"inputLength": 3}},
    {"id": "output_x", "type": "Output", "label": "X"}
  ],
  "connections": [
    {"from": "input_a", "fromNode": "output1", "to": "and_gate", "toNode": "inp[0]"},
    {"from": "input_b", "fromNode": "output1", "to": "and_gate", "toNode": "inp[1]"},
    {"from": "input_c", "fromNode": "output1", "to": "and_gate", "toNode": "inp[2]"},
    {"from": "and_gate", "fromNode": "output1", "to": "output_x", "toNode": "inp1"}
  ]
}
```

### Example: Half Adder (Gate-Level - only if explicitly requested)
```json
{
  "name": "Half Adder (Gate-Level)",
  "description": "Half adder using XOR and AND gates - use only if gate-level is requested",
  "elements": [
    {"id": "input_a", "type": "Input", "label": "A"},
    {"id": "input_b", "type": "Input", "label": "B"},
    {"id": "xor_sum", "type": "XorGate", "label": "XOR", "labelDirection": "UP"},
    {"id": "and_carry", "type": "AndGate", "label": "AND", "labelDirection": "UP"},
    {"id": "output_sum", "type": "Output", "label": "SUM"},
    {"id": "output_carry", "type": "Output", "label": "CARRY"}
  ],
  "connections": [
    {"from": "input_a", "fromNode": "output1", "to": "xor_sum", "toNode": "inp[0]"},
    {"from": "input_b", "fromNode": "output1", "to": "xor_sum", "toNode": "inp[1]"},
    {"from": "input_a", "fromNode": "output1", "to": "and_carry", "toNode": "inp[0]"},
    {"from": "input_b", "fromNode": "output1", "to": "and_carry", "toNode": "inp[1]"},
    {"from": "xor_sum", "fromNode": "output1", "to": "output_sum", "toNode": "inp1"},
    {"from": "and_carry", "fromNode": "output1", "to": "output_carry", "toNode": "inp1"}
  ]
}
```

### Example: SR Latch (Gate-Level)
```json
{
  "name": "SR Latch",
  "description": "Set-Reset latch using NOR gates",
  "elements": [
    {"id": "input_s", "type": "Input", "label": "S"},
    {"id": "input_r", "type": "Input", "label": "R"},
    {"id": "nor1", "type": "NorGate", "label": "NOR", "labelDirection": "UP"},
    {"id": "nor2", "type": "NorGate", "label": "NOR", "labelDirection": "UP"},
    {"id": "output_q", "type": "Output", "label": "Q"},
    {"id": "output_qbar", "type": "Output", "label": "Q'"}
  ],
  "connections": [
    {"from": "input_s", "fromNode": "output1", "to": "nor1", "toNode": "inp[0]"},
    {"from": "nor2", "fromNode": "output1", "to": "nor1", "toNode": "inp[1]"},
    {"from": "input_r", "fromNode": "output1", "to": "nor2", "toNode": "inp[0]"},
    {"from": "nor1", "fromNode": "output1", "to": "nor2", "toNode": "inp[1]"},
    {"from": "nor1", "fromNode": "output1", "to": "output_q", "toNode": "inp1"},
    {"from": "nor2", "fromNode": "output1", "to": "output_qbar", "toNode": "inp1"}
  ]
}
```

---

## Rules for AI Circuit Generation

1. **USE PRE-BUILT COMPONENTS** - Always prefer Adder, ALU, Multiplexer, etc. over gate-level implementations

2. **Element IDs**: Use descriptive snake_case IDs (e.g., `input_a`, `adder_1`, `output_sum`)

3. **Node Names**: Use exact node names from this document:
   - Adder: `inpA`, `inpB`, `carryIn` → `sum`, `carryOut`
   - ALU: `inp1`, `inp2`, `controlSignalInput` → `output`, `carryOut`
   - Gates: `inp[0]`, `inp[1]`, ... → `output1`
   - Input elements: → `output1`
   - Output elements: `inp1` →

4. **Labels**:
   - Inputs: A, B, C, D, etc.
   - Gates: AND, OR, XOR, etc. (no numbers)
   - Outputs: SUM, CARRY, RESULT, Q, etc.
   - Set `labelDirection` to "UP" for all components

5. **Multi-bit Circuits**:
   - Set `bitWidth` property on Input, Output, and component
   - All connected elements must have matching bitWidth

6. **Multi-input Gates**:
   - Set `inputLength` property (default is 2)
   - Use `inp[0]`, `inp[1]`, `inp[2]`, etc.

7. **Circuit Flow**:
   - Inputs on the left
   - Processing in the middle
   - Outputs on the right

---

## Node Reference Quick Reference

### Common Patterns:
- **All Inputs**: Output is `output1`
- **All Outputs**: Input is `inp1`
- **Multi-input gates**: `inp[0]`, `inp[1]`, `inp[2]`, ...
- **Single-input gates (NOT)**: `inp1`
- **Flip-flops**: Q is `qOutput`, Q' is `qInvOutput`

### Special Components:
- **Adder**: `inpA`, `inpB`, `carryIn` → `sum`, `carryOut`
- **ALU**: `inp1`, `inp2`, `controlSignalInput` → `output`, `carryOut`
- **Multiplexer**: `inp[0]`, `inp[1]`, ..., `controlSignalInput` → `output1`
- **Demultiplexer**: `input`, `controlSignalInput` → `output1[0]`, `output1[1]`, ...
- **Decoder**: `input` → `output1[0]`, `output1[1]`, ...
- **RAM**: `address`, `dataIn`, `write`, `reset` → `dataOut`
- **D Flip-Flop**: `dInp`, `clockInp`, `reset`, `preset`, `en` → `qOutput`, `qInvOutput`

---

## Additional Resources

- CircuitVerse documentation: https://docs.circuitverse.org/
- Element source code: `CircuitVerse-master/simulator/src/modules/`
