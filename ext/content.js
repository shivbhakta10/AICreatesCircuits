// Inject bridge script to bypass CSP
(function() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
})();

// Wait for CircuitVerse to be ready
function waitForCircuitVerse(callback, maxAttempts = 100) {
  let attempts = 0;
  let callbackCalled = false;
  
  const checkReady = () => {
    if (callbackCalled) return;
    attempts++;
    
    const readyHandler = () => {
      if (!callbackCalled) {
        callbackCalled = true;
        window.removeEventListener('circuitVerseBridgeReady', readyHandler);
        callback();
      }
    };
    
    window.addEventListener('circuitVerseBridgeReady', readyHandler);
    window.dispatchEvent(new CustomEvent('checkCircuitVerseReady'));
    
    if (attempts >= maxAttempts) {
      window.removeEventListener('circuitVerseBridgeReady', readyHandler);
      return;
    }
    
    if (!callbackCalled) {
      setTimeout(() => {
        window.removeEventListener('circuitVerseBridgeReady', readyHandler);
        checkReady();
      }, 200);
    }
  };
  
  checkReady();
}

// Note: Main circuit creation logic is now in injected.js
// This allows direct access to CircuitVerse internals

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addElement') {
    waitForCircuitVerse(() => {
      addCircuitElement(request.elementType || 'Input');
      sendResponse({ status: 'success', elementType: request.elementType });
    });
  }
  return true;
});

// Create AI Circuit Generator UI
function createCircuitGeneratorUI() {
  const container = document.createElement('div');
  container.id = 'ai-circuit-generator';
  // SVG icon for the circuit/AI themed button
  const circuitIcon = `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="14" width="20" height="20" rx="2" fill="white" fill-opacity="0.95"/>
    <path d="M19 14V9M29 14V9M19 34V39M29 34V39M14 19H9M14 29H9M34 19H39M34 29H39" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M24 18L25.8 22.2L30 24L25.8 25.8L24 30L22.2 25.8L18 24L22.2 22.2Z" fill="#42b983"/>
  </svg>`;

  // Small icon for header
  const headerIcon = `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#42b983"/>
    <rect x="14" y="14" width="20" height="20" rx="2" fill="white" fill-opacity="0.95"/>
    <path d="M19 14V9M29 14V9M19 34V39M29 34V39M14 19H9M14 29H9M34 19H39M34 29H39" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M24 18L25.8 22.2L30 24L25.8 25.8L24 30L22.2 25.8L18 24L22.2 22.2Z" fill="#42b983"/>
  </svg>`;

  container.innerHTML = `
    <style>
      #ai-circuit-generator {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      #ai-generator-toggle {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: none;
        background: #42b983;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      #ai-generator-toggle:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(66, 185, 131, 0.4);
      }

      #ai-generator-toggle:active {
        transform: scale(0.98);
      }

      #ai-generator-toggle svg {
        width: 28px;
        height: 28px;
      }

      #ai-generator-panel {
        position: absolute;
        bottom: 64px;
        left: 0;
        width: 340px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        padding: 20px;
        display: none;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.2s ease;
      }

      #ai-generator-panel.visible {
        display: block;
        opacity: 1;
        transform: translateY(0);
      }

      #ai-generator-panel h3 {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 16px 0;
        padding-bottom: 16px;
        border-bottom: 1px solid #f0f0f0;
        font-size: 16px;
        font-weight: 600;
        color: #454545;
      }

      #ai-generator-panel h3 svg {
        width: 22px;
        height: 22px;
        flex-shrink: 0;
      }

      #ai-circuit-description {
        width: 100%;
        min-height: 100px;
        padding: 14px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #f8f9fa;
        font-size: 14px;
        color: #454545;
        resize: vertical;
        box-sizing: border-box;
        font-family: inherit;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      #ai-circuit-description::placeholder {
        color: #bbbbbb;
      }

      #ai-circuit-description:focus {
        outline: none;
        border-color: #42b983;
        box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
        background: #ffffff;
      }

      #ai-generate-btn {
        width: 100%;
        padding: 14px 20px;
        margin-top: 12px;
        background: #42b983;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      #ai-generate-btn:hover:not(:disabled) {
        background: #3ca877;
      }

      #ai-generate-btn:active:not(:disabled) {
        background: #026e57;
      }

      #ai-generate-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      #ai-status-message {
        display: none;
        margin-top: 12px;
        padding: 12px;
        border-radius: 6px;
        font-size: 13px;
      }

      #ai-status-message.success {
        display: block;
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
      }

      #ai-status-message.error {
        display: block;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }

      #ai-status-message.loading {
        display: block;
        background: #e8f4f8;
        border: 1px solid #bee5eb;
        color: #0c5460;
      }
    </style>

    <button id="ai-generator-toggle" title="AI Circuit Generator">${circuitIcon}</button>

    <div id="ai-generator-panel">
      <h3>${headerIcon} AI Circuit Generator</h3>
      <textarea
        id="ai-circuit-description"
        placeholder="Describe your circuit...&#10;Example: Create an AND gate with two inputs A and B"
      ></textarea>
      <button id="ai-generate-btn">Generate Circuit</button>
      <div id="ai-status-message"></div>
    </div>
  `;
  
  document.body.appendChild(container);
  
  const toggle = document.getElementById('ai-generator-toggle');
  const panel = document.getElementById('ai-generator-panel');
  const generateBtn = document.getElementById('ai-generate-btn');
  const description = document.getElementById('ai-circuit-description');
  const statusMsg = document.getElementById('ai-status-message');
  
  // Toggle panel
  toggle.addEventListener('click', () => {
    panel.classList.toggle('visible');
  });
  
  // Generate circuit
  generateBtn.addEventListener('click', async () => {
    const desc = description.value.trim();
    if (!desc) {
      showStatus('Please enter a circuit description', 'error');
      return;
    }
    
    generateBtn.disabled = true;
    showStatus('Generating circuit...', 'loading');
    
    try {
      const response = await fetch('http://localhost:3000/api/generate-circuit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate circuit');
      }
      
      // Send circuit JSON to injected.js via custom event
      window.dispatchEvent(new CustomEvent('createCircuitFromAI', {
        detail: { circuitJson: JSON.stringify(data.circuit) }
      }));
      
      showStatus('Circuit created successfully!', 'success');
      setTimeout(() => {
        panel.classList.remove('visible');
        description.value = '';
        statusMsg.className = '';
        statusMsg.style.display = 'none';
      }, 2000);
      
    } catch (error) {
      showStatus('Error: ' + error.message, 'error');
    } finally {
      generateBtn.disabled = false;
    }
  });
  
  function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = type;
  }
  
  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      panel.classList.remove('visible');
    }
  });
}

// Initialize UI when CircuitVerse is ready
waitForCircuitVerse(() => {
  createCircuitGeneratorUI();
});
