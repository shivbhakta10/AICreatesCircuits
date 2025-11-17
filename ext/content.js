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
  container.innerHTML = `
    <style>
      #ai-circuit-generator {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }
      
      #ai-generator-toggle {
        width: 56px;
        height: 56px;
        border-radius: 28px;
        border: none;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      
      #ai-generator-toggle:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
      }
      
      #ai-generator-toggle:active {
        transform: translateY(0);
      }
      
      #ai-generator-panel {
        position: absolute;
        bottom: 70px;
        left: 0;
        width: 320px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        padding: 20px;
        display: none;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
      }
      
      #ai-generator-panel.visible {
        display: block;
        opacity: 1;
        transform: translateY(0);
      }
      
      #ai-generator-panel h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1a202c;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      #ai-circuit-description {
        width: 100%;
        min-height: 80px;
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        resize: vertical;
        transition: border-color 0.2s;
        box-sizing: border-box;
        font-family: inherit;
      }
      
      #ai-circuit-description:focus {
        outline: none;
        border-color: #667eea;
      }
      
      #ai-generate-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 12px;
      }
      
      #ai-generate-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      
      #ai-generate-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      #ai-status-message {
        margin-top: 12px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        display: none;
      }
      
      #ai-status-message.success {
        background: #d4edda;
        color: #155724;
        display: block;
      }
      
      #ai-status-message.error {
        background: #f8d7da;
        color: #721c24;
        display: block;
      }
      
      #ai-status-message.loading {
        background: #d1ecf1;
        color: #0c5460;
        display: block;
      }
    </style>
    
    <button id="ai-generator-toggle" title="AI Circuit Generator">✨</button>
    
    <div id="ai-generator-panel">
      <h3>✨ AI Circuit Generator</h3>
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
