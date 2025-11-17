# CircuitVerse Circuit Builder - Chrome Extension

A Chrome extension that automatically creates and wires circuit elements on CircuitVerse canvas.

## Features

- 🔌 **Auto-create circuits** - One command creates complete wired circuits
- 🏷️ **Smart labeling** - Inputs labeled A, B, C..., Gates labeled with type, Output labeled X
- 📍 **Smart positioning** - Elements organized by category (Inputs left, Gates center, Outputs right)
- 🔗 **Auto-wiring** - Automatically connects elements with proper node mapping
- 🎯 **Auto-center** - Centers view on created circuit
- ⚡ **No UI needed** - Works via console commands

## Files

- `manifest.json` - Extension configuration
- `background.js` - Minimal service worker (6 lines)
- `content.js` - Bridge injector
- `injected.js` - Main logic in page context

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `d:\Shiv\CS 4341` folder
5. The extension will be installed and active

## Usage

### Quick Start - Create Complete Circuit

1. Open CircuitVerse simulator (https://circuitverse.org/simulator)
2. Open browser console (F12)
3. Run:

```javascript
createSimpleCircuit()
```

This creates:
- **Input A** → **AndGate** → **Output X**
- **Input B** ↗

All elements are automatically:
- ✅ Created with proper orientation
- ✅ Labeled (A, B, AND, X)
- ✅ Wired together
- ✅ Centered in view

### Advanced - Add Individual Elements

```javascript
// Add single elements
window.dispatchEvent(new CustomEvent('addCircuitElement', { 
  detail: { elementType: 'Input' } 
}));

window.dispatchEvent(new CustomEvent('addCircuitElement', { 
  detail: { elementType: 'OrGate' } 
}));

window.dispatchEvent(new CustomEvent('addCircuitElement', { 
  detail: { elementType: 'Output' } 
}));
```

## Testing

1. Open CircuitVerse (https://circuitverse.org/simulator)
2. Wait for the page to fully load
3. Open console (F12) and run the command above
4. The element will appear at the center of the canvas automatically
5. Check console logs for confirmation

## Element Categories & Positioning

- **Input** (x=50): Input, Button, Power, Ground, ConstantVal, Stepper, Random, Counter
- **Gates** (x=225): AndGate, OrGate, NotGate, NandGate, NorGate, XorGate, XnorGate
- **Output** (x=400): Output, DigitalLed, RGBLed, SquareRGBLed, HexDisplay, SevenSegDisplay
- **Plexers** (x=225, y=200): Multiplexer, Demultiplexer, BitSelector, Decoder
- **Sequential** (x=225, y=350): DflipFlop, TflipFlop, JKflipFlop, SRflipFlop, Dlatch, Clock
- **Memory**: RAM, ROM, EEPROM
- **Misc**: Splitter, Adder, ALU, TriState, Tunnel, Buffer

## How It Works

1. **Script Injection**: `injected.js` runs in page context to access `globalScope` and CircuitVerse internals
2. **Constructor Discovery**: Creates temporary elements to extract constructors, then deletes them
3. **Element Creation**: Uses constructors to instantiate elements with correct parameters:
   - Inputs: `direction='RIGHT'`
   - Outputs: `direction='LEFT'`
   - Gates: `direction='RIGHT'`, `inputLength=2`
4. **Smart Positioning**: Category-based layout (spacing: 50px, wrap at y>500)
5. **Wire Connections**: Uses `node.connect()` to create wires between elements
6. **Auto-center**: Calls `menuItemClicked(7)` to center view

## Troubleshooting

- **`createSimpleCircuit is not defined`**: Reload the page after installing extension
- **Elements not appearing**: Check console for errors, ensure CircuitVerse is fully loaded
- **Connection errors**: Elements must be fully created before wiring (function handles delays)
- **CSP errors**: Script injection via `web_accessible_resources` bypasses Content Security Policy

## How the Fixed Version Works

The updated extension uses a bridge pattern to bypass Content Security Policy (CSP) restrictions:

1. **External Script Injection**: `content.js` injects `injected.js` as an external script (not inline) to bypass CSP
2. **Page Context Access**: `injected.js` runs in the page's context, giving it direct access to `globalScope`, `modules`, and `simulationArea`
3. **Bridge Object**: Creates `window.__circuitVerseBridge` with methods to check readiness and add elements
4. **Event Communication**: Uses CustomEvents to communicate between the content script and injected script
5. **Ready Detection**: Polls every 100ms until CircuitVerse is fully initialized (up to 20 seconds)
6. **Web Accessible Resources**: The manifest declares `injected.js` as a web accessible resource so it can be loaded by the content script

**Architecture:**
```
Background Script → Content Script → Injected Script → CircuitVerse
                    (CustomEvents)   (Direct Access)
```

## Development Notes

This extension uses CircuitVerse's internal API:
- `modules[elementType]` - Constructor for circuit elements
- `globalScope` - Current circuit scope
- `simulationArea` - Canvas and simulation state
- Element constructors: `new modules[type](x, y, scope, direction, bitWidth)`
