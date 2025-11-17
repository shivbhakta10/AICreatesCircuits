// Background script for CircuitVerse Element Adder
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'elementAdded') {
    sendResponse({ status: 'received' });
  }
  return true;
});
