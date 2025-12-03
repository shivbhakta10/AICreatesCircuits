// Injected script - runs in page context to access CircuitVerse internals
(function() {
  window.__circuitVerseBridge = {
    isReady: false,
    createdElements: {},
    elementIdCounter: 0,
    isInvertedCircuit: false,  // Flag for circuits with Decoder/Demux
    
    checkReady: function() {
      try {
        return typeof globalScope !== 'undefined' && 
               globalScope !== null && 
               globalScope.id !== undefined &&
               Array.isArray(globalScope.Input);
      } catch (e) {
        return false;
      }
    },
    
    getElementCategory: function(elementType) {
      const categories = {
        'Input': ['Input', 'Button', 'Power', 'Ground', 'ConstantVal', 'Stepper', 'Random', 'Counter'],
        'Output': ['Output', 'RGBLed', 'DigitalLed', 'VariableLed', 'HexDisplay', 'SevenSegDisplay', 'SixteenSegDisplay', 'SquareRGBLed', 'RGBLedMatrix'],
        'Gates': ['AndGate', 'OrGate', 'NotGate', 'XorGate', 'NandGate', 'NorGate', 'XnorGate'],
        'Plexers': ['Multiplexer', 'Demultiplexer', 'BitSelector', 'MSB', 'LSB', 'PriorityEncoder', 'Decoder'],
        'Sequential': ['DflipFlop', 'Dlatch', 'TflipFlop', 'JKflipFlop', 'SRflipFlop', 'TTY', 'Keyboard', 'Clock', 'Rom', 'RAM', 'EEPROM'],
        'Annotation': ['Rectangle', 'Arrow', 'ImageAnnotation', 'Text'],
        'Misc': ['TwoComplement', 'Flag', 'Splitter', 'Adder', 'ALU', 'TriState', 'Tunnel', 'Buffer', 'ControlledInverter', 'TB_Input', 'TB_Output', 'ForceGate']
      };
      
      for (const [category, elements] of Object.entries(categories)) {
        if (elements.includes(elementType)) return category;
      }
      return 'Misc';
    },
    
    getElementProperties: function(elementType, category) {
      const properties = {
        direction: 'RIGHT',
        bitWidth: 1,
        inputLength: undefined
      };

      // Set direction based on category
      if (category === 'Output') {
        properties.direction = 'LEFT';
      }

      // For inverted circuits (Decoder/Demux), swap Input/Output directions
      // so their connection nodes face toward the center component
      if (this.isInvertedCircuit) {
        if (category === 'Input') {
          properties.direction = 'LEFT';  // Input's output1 node faces left
        } else if (category === 'Output') {
          properties.direction = 'RIGHT'; // Output's inp1 node faces right
        }
      }

      // Gates with multiple inputs
      const multiInputGates = ['AndGate', 'OrGate', 'NandGate', 'NorGate', 'XorGate', 'XnorGate'];
      if (multiInputGates.includes(elementType)) {
        properties.inputLength = 2;
      }

      // Plexers with input count
      const multiInputPlexers = ['Multiplexer', 'Demultiplexer'];
      if (multiInputPlexers.includes(elementType)) {
        properties.inputLength = 2;
      }

      return properties;
    },
    
    getNextPosition: function(elementType, category) {
      if (!this.positions) {
        this.positions = {
          'Input': { x: 50, y: 50, spacing: 50 },
          'Output': { x: 400, y: 50, spacing: 50 },
          'Gates': { x: 225, y: 50, spacing: 80 },
          'Plexers': { x: 225, y: 200, spacing: 60 },
          'Sequential': { x: 225, y: 350, spacing: 70 },
          'Annotation': { x: 50, y: 350, spacing: 60 },
          'Misc': { x: 225, y: 50, spacing: 60 }
        };
      }
      
      const pos = this.positions[category];
      const x = pos.x;
      const y = pos.y;
      
      // Move to next position for this category
      pos.y += pos.spacing;
      
      // Wrap to next column if too many elements
      if (pos.y > 500) {
        pos.y = 50;
        pos.x += 100;
      }
      
      return { x, y };
    },
    
    addElement: async function(elementType, customProperties) {
      try {
        if (!this.checkReady()) {
          return { success: false, error: 'CircuitVerse not ready' };
        }
        
        // Get category, position, and properties
        const category = this.getElementCategory(elementType);
        const { x, y } = this.getNextPosition(elementType, category);
        const props = this.getElementProperties(elementType, category);
        
        // Merge custom properties if provided
        if (customProperties) {
          Object.assign(props, customProperties);
        }
        
        let ElementConstructor = null;
        
        // Try to get constructor from existing elements
        if (globalScope[elementType]?.length > 0) {
          ElementConstructor = globalScope[elementType][0].constructor;
        }
        
        if (!ElementConstructor) {
          // Find the UI button
          const elementButton = document.querySelector(`#${elementType}`);
          
          if (!elementButton) {
            return { success: false, error: 'Element button not found: ' + elementType };
          }
          
          const initialCount = globalScope[elementType]?.length || 0;
          
          // Create temporary element to get constructor
          elementButton.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window
          }));
          
          // Wait for constructor to be available
          await new Promise((resolve) => {
            setTimeout(() => {
              if (globalScope[elementType]?.length > initialCount) {
                const tempElement = globalScope[elementType][globalScope[elementType].length - 1];
                ElementConstructor = tempElement.constructor;
                tempElement.delete();
              }
              resolve();
            }, 100);
          });
          
          if (!ElementConstructor) {
            return { success: false, error: 'Failed to get constructor for ' + elementType };
          }
        }
        
        // Create using constructor
        let element;
        if (props.inputLength !== undefined) {
          element = new ElementConstructor(x, y, globalScope, props.direction, props.inputLength, props.bitWidth);
        } else {
          element = new ElementConstructor(x, y, globalScope, props.direction, props.bitWidth);
        }
        element.newElement = false;
        if (props.label && element.setLabel) {
          element.setLabel(props.label);
        }
        simulationArea.lastSelected = element;
        
        // Store element with unique ID
        const elementId = 'elem_' + (this.elementIdCounter++);
        this.createdElements[elementId] = element;
        
        if (typeof scheduleUpdate === 'function') {
          scheduleUpdate();
        }
        
        return { success: true, elementType, x, y, elementId, category };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    connectWire: function(elementId1, nodeName1, elementId2, nodeName2) {
      try {
        if (!this.checkReady()) {
          return { success: false, error: 'CircuitVerse not ready' };
        }
        
        // Find elements by ID in createdElements
        const element1 = this.createdElements?.[elementId1];
        const element2 = this.createdElements?.[elementId2];
        
        if (!element1 || !element2) {
          return { success: false, error: 'Elements not found' };
        }
        
        // Get nodes - handle array notation like inp[0]
        let node1, node2;
        
        if (nodeName1.includes('[')) {
          const match = nodeName1.match(/(.+?)\[(\d+)\]/);
          node1 = element1[match[1]]?.[parseInt(match[2])];
        } else {
          node1 = element1[nodeName1];
        }
        
        if (nodeName2.includes('[')) {
          const match = nodeName2.match(/(.+?)\[(\d+)\]/);
          node2 = element2[match[1]]?.[parseInt(match[2])];
        } else {
          node2 = element2[nodeName2];
        }
        
        if (!node1 || !node2) {
          return { success: false, error: 'Nodes not found: ' + nodeName1 + ', ' + nodeName2 };
        }
        
        // Connect nodes (creates wire automatically)
        node1.connect(node2);

        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    clearCurrentCircuit: function() {
      try {
        if (!this.checkReady()) {
          return { success: false, error: 'CircuitVerse not ready' };
        }

        // Clear all elements from current scope
        globalScope.initialize();

        // Reset tracking
        this.createdElements = {};
        this.elementIdCounter = 0;
        this.positions = null;

        // Trigger UI update
        if (typeof scheduleUpdate === 'function') {
          scheduleUpdate();
        }

        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };
  
  // Update ready status periodically
  const updateReadyStatus = () => {
    const wasReady = window.__circuitVerseBridge.isReady;
    window.__circuitVerseBridge.isReady = window.__circuitVerseBridge.checkReady();
    
    if (window.__circuitVerseBridge.isReady && !wasReady) {
      window.dispatchEvent(new CustomEvent('circuitVerseBridgeReady'));
    }
  };
  
  updateReadyStatus();
  const interval = setInterval(() => {
    if (!window.__circuitVerseBridge.isReady) {
      updateReadyStatus();
    } else {
      clearInterval(interval);
    }
  }, 100);
  
  // Listen for requests from content script
  window.addEventListener('checkCircuitVerseReady', () => {
    if (window.__circuitVerseBridge.isReady) {
      window.dispatchEvent(new CustomEvent('circuitVerseBridgeReady'));
    }
  });
  
  window.addEventListener('addCircuitElement', (event) => {
    const result = window.__circuitVerseBridge.addElement(event.detail.elementType);
    window.dispatchEvent(new CustomEvent('circuitElementAdded', { detail: result }));
  });
  
  window.addEventListener('connectCircuitWire', (event) => {
    const { elementId1, nodeName1, elementId2, nodeName2 } = event.detail;
    const result = window.__circuitVerseBridge.connectWire(elementId1, nodeName1, elementId2, nodeName2);
    window.dispatchEvent(new CustomEvent('circuitWireConnected', { detail: result }));
  });
  
  // Components that have inverted node positions (input on right, outputs on left)
  // These need special handling for proper left-to-right circuit flow
  const INVERTED_COMPONENTS = ['Decoder', 'Demultiplexer'];

  // Analyze circuit and assign layers for organized layout
  function assignCircuitLayers(circuit) {
    const layers = {};
    const elementTypes = {};

    // Build element type map
    circuit.elements.forEach(elem => {
      elementTypes[elem.id] = elem.type;
    });

    // Check if circuit contains inverted components
    const hasInvertedComponent = circuit.elements.some(elem =>
      INVERTED_COMPONENTS.includes(elem.type)
    );

    // Build dependency graph (what feeds into what)
    const dependencies = {};
    const dependents = {};
    circuit.elements.forEach(elem => {
      dependencies[elem.id] = [];
      dependents[elem.id] = [];
    });

    if (circuit.connections) {
      circuit.connections.forEach(conn => {
        dependencies[conn.to] = dependencies[conn.to] || [];
        dependencies[conn.to].push(conn.from);
        dependents[conn.from] = dependents[conn.from] || [];
        dependents[conn.from].push(conn.to);
      });
    }

    // Assign layers using topological ordering
    const visited = new Set();
    const getLayer = (id) => {
      if (layers[id] !== undefined) return layers[id];

      const deps = dependencies[id] || [];
      if (deps.length === 0) {
        // Input elements are at layer 0
        layers[id] = 0;
      } else {
        // Element is one layer after its deepest dependency
        const maxDepLayer = Math.max(...deps.map(depId => getLayer(depId)));
        layers[id] = maxDepLayer + 1;
      }
      return layers[id];
    };

    circuit.elements.forEach(elem => getLayer(elem.id));

    // For circuits with inverted components (Decoder, Demux), swap input/output positions
    // These components have input node on RIGHT and output nodes on LEFT
    // So we need to place: Outputs on LEFT, Component in MIDDLE, Inputs on RIGHT
    if (hasInvertedComponent) {
      const maxLayer = Math.max(...Object.values(layers));
      Object.keys(layers).forEach(id => {
        layers[id] = maxLayer - layers[id];
      });
    }

    // Group elements by layer
    const layerGroups = {};
    Object.entries(layers).forEach(([id, layer]) => {
      if (!layerGroups[layer]) layerGroups[layer] = [];
      layerGroups[layer].push(id);
    });

    return { layers, layerGroups, hasInvertedComponent };
  }
  
  // Position elements based on their layer
  function calculatePositions(circuit, layers, layerGroups) {
    const positions = {};
    const layerWidth = 175; // Horizontal spacing between layers
    const elementSpacing = 80; // Vertical spacing between elements
    
    // Find the tallest column (most elements in a layer)
    const maxElementsInLayer = Math.max(...Object.values(layerGroups).map(arr => arr.length));
    const totalHeight = maxElementsInLayer * elementSpacing;
    
    // Calculate starting positions to center the circuit
    const numLayers = Object.keys(layerGroups).length;
    const totalWidth = numLayers * layerWidth;
    const startX = Math.max(100, (800 - totalWidth) / 2); // Center horizontally, min 100px from left
    const startY = Math.max(100, (600 - totalHeight) / 2); // Center vertically, min 100px from top
    
    Object.entries(layerGroups).forEach(([layer, elementIds]) => {
      const layerNum = parseInt(layer);
      const x = startX + (layerNum * layerWidth);
      
      // Center elements vertically within this layer
      const layerHeight = elementIds.length * elementSpacing;
      const layerStartY = startY + (totalHeight - layerHeight) / 2;
      
      elementIds.forEach((id, index) => {
        const y = layerStartY + (index * elementSpacing);
        positions[id] = { x, y };
      });
    });
    
    return positions;
  }
  
  // Create circuit from JSON definition
  window.createCircuitFromJSON = async function(jsonString) {
    try {
      const circuit = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

      if (!circuit.elements || !Array.isArray(circuit.elements)) {
        console.error('Invalid circuit JSON: missing or invalid elements array');
        return;
      }

      // Clear existing circuit before creating new one
      const clearResult = window.__circuitVerseBridge.clearCurrentCircuit();
      console.log('Cleared existing circuit:', clearResult.success ? 'OK' : clearResult.error);

      console.log(`Creating circuit: ${circuit.name || 'Unnamed'}`);
      if (circuit.description) console.log(`Description: ${circuit.description}`);
      
      // Analyze circuit structure and calculate optimal positions
      const { layers, layerGroups, hasInvertedComponent } = assignCircuitLayers(circuit);
      const positions = calculatePositions(circuit, layers, layerGroups);

      if (hasInvertedComponent) {
        console.log('Circuit contains inverted components (Decoder/Demux) - using reversed layout');
      }
      console.log('Circuit layers:', layerGroups);

      // Set inverted circuit flag so Input/Output directions are swapped
      window.__circuitVerseBridge.isInvertedCircuit = hasInvertedComponent;

      // Temporarily disable automatic positioning
      const originalGetNextPosition = window.__circuitVerseBridge.getNextPosition;
      let customPositionOverride = null;
      
      window.__circuitVerseBridge.getNextPosition = function(elementType, category) {
        if (customPositionOverride) {
          const pos = customPositionOverride;
          customPositionOverride = null;
          return pos;
        }
        return originalGetNextPosition.call(this, elementType, category);
      };
      
      // Create all elements with calculated positions
      const elementMap = {};
      for (const elem of circuit.elements) {
        const inputLength = elem.properties?.inputLength;
        const logMsg = inputLength 
          ? `Creating ${elem.type} (${elem.id}) with ${inputLength} inputs at layer ${layers[elem.id]}...`
          : `Creating ${elem.type} (${elem.id}) at layer ${layers[elem.id]}...`;
        console.log(logMsg);
        
        // Set position override before creating element
        customPositionOverride = positions[elem.id];
        
        // Pass custom properties to addElement
        const result = await window.__circuitVerseBridge.addElement(elem.type, elem.properties);
        
        if (!result.success) {
          console.error(`Failed to create ${elem.type}:`, result.error);
          continue;
        }
        
        elementMap[elem.id] = result.elementId;
        
        // Apply label and properties
        const element = window.__circuitVerseBridge.createdElements[result.elementId];
        if (element) {
          if (elem.label && element.setLabel) {
            element.setLabel(elem.label);
          }
          if (elem.labelDirection) {
            element.labelDirection = elem.labelDirection;
          }
        }
      }
      
      // Restore original positioning function
      window.__circuitVerseBridge.getNextPosition = originalGetNextPosition;
      
      // Wait for all elements to be ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Create all connections
      if (circuit.connections && Array.isArray(circuit.connections)) {
        for (const conn of circuit.connections) {
          const fromId = elementMap[conn.from];
          const toId = elementMap[conn.to];
          
          if (!fromId || !toId) {
            console.error(`Connection failed: element not found (${conn.from} -> ${conn.to})`);
            continue;
          }
          
          console.log(`Connecting ${conn.from}.${conn.fromNode} -> ${conn.to}.${conn.toNode}`);
          const result = window.__circuitVerseBridge.connectWire(
            fromId, conn.fromNode,
            toId, conn.toNode
          );
          
          if (!result.success) {
            console.error(`Failed to connect ${conn.from} to ${conn.to}:`, result.error);
          }
        }
      }
      
      // Center view
      if (typeof menuItemClicked === 'function') {
        menuItemClicked(7);
        console.log('✓ View centered');
      }

      // Reset inverted circuit flag
      window.__circuitVerseBridge.isInvertedCircuit = false;

      console.log(`✓ Circuit "${circuit.name || 'Unnamed'}" created successfully!`);
      return { success: true, elementMap };

    } catch (error) {
      console.error('Error creating circuit from JSON:', error);
      window.__circuitVerseBridge.isInvertedCircuit = false;  // Reset on error too
      return { success: false, error: error.message };
    }
  };
  
  // Expose createSimpleCircuit to page context
  window.createSimpleCircuit = async function() {
    if (!window.__circuitVerseBridge.checkReady()) {
      console.error('CircuitVerse not ready yet');
      return;
    }
    
    console.log('Creating Input A...');
    const inputA = await window.__circuitVerseBridge.addElement('Input');
    if (!inputA.success) {
      console.error('Failed to create Input A:', inputA.error);
      return;
    }
    
    console.log('Creating Input B...');
    const inputB = await window.__circuitVerseBridge.addElement('Input');
    if (!inputB.success) {
      console.error('Failed to create Input B:', inputB.error);
      return;
    }
    
    console.log('Creating AndGate...');
    const gate = await window.__circuitVerseBridge.addElement('AndGate');
    if (!gate.success) {
      console.error('Failed to create AndGate:', gate.error);
      return;
    }
    
    console.log('Creating Output X...');
    const output = await window.__circuitVerseBridge.addElement('Output');
    if (!output.success) {
      console.error('Failed to create Output X:', output.error);
      return;
    }
    
    // Label the elements
    const elemA = window.__circuitVerseBridge.createdElements[inputA.elementId];
    const elemB = window.__circuitVerseBridge.createdElements[inputB.elementId];
    const elemGate = window.__circuitVerseBridge.createdElements[gate.elementId];
    const elemOut = window.__circuitVerseBridge.createdElements[output.elementId];
    
    if (elemA && elemA.setLabel) elemA.setLabel('A');
    if (elemB && elemB.setLabel) elemB.setLabel('B');
    if (elemGate && elemGate.setLabel) {
      elemGate.setLabel('AND');
      elemGate.labelDirection = 'UP';
    }
    if (elemOut && elemOut.setLabel) elemOut.setLabel('X');
    
    // Small delay to ensure elements are rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Connecting Input A to AndGate...');
    const wire1 = window.__circuitVerseBridge.connectWire(
      inputA.elementId, 'output1',
      gate.elementId, 'inp[0]'
    );
    if (!wire1.success) {
      console.error('Failed to connect Input A to AndGate:', wire1.error);
      return;
    }
    
    console.log('Connecting Input B to AndGate...');
    const wire2 = window.__circuitVerseBridge.connectWire(
      inputB.elementId, 'output1',
      gate.elementId, 'inp[1]'
    );
    if (!wire2.success) {
      console.error('Failed to connect Input B to AndGate:', wire2.error);
      return;
    }
    
    console.log('Connecting AndGate to Output X...');
    const wire3 = window.__circuitVerseBridge.connectWire(
      gate.elementId, 'output1',
      output.elementId, 'inp1'
    );
    if (!wire3.success) {
      console.error('Failed to connect AndGate to Output X:', wire3.error);
      return;
    }
    
    console.log('✓ Circuit created successfully!');
    
    // Center focus on the circuit
    if (typeof menuItemClicked === 'function') {
      menuItemClicked(7);
      console.log('✓ Centered view');
    }
    
    return { inputA, inputB, gate, output };
  };
  
  // Listen for AI-generated circuit creation events
  window.addEventListener('createCircuitFromAI', async (event) => {
    if (event.detail && event.detail.circuitJson) {
      console.log('Received AI circuit request');
      const result = await window.createCircuitFromJSON(event.detail.circuitJson);
      if (result && result.success) {
        console.log('✓ AI circuit created successfully');
      } else {
        console.error('Failed to create AI circuit:', result?.error || 'Unknown error');
      }
    }
  });
})();
