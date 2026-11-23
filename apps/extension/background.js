chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn('ZunDeck SidePanel setPanelBehavior error:', err);
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === 'GET_ACTIVE_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0] ? tabs[0] : null;
      sendResponse({ tab: activeTab });
    });
    return true;
  }

  // Inject content script ONLY on explicit user trigger
  if (message?.action === 'INJECT_SCROLL_HARVESTER') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs && tabs[0]?.id;
      if (!tabId) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content/scroll-harvester.js']
        });
        sendResponse({ success: true, tabId });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  // Forward actions to active tab content script
  if (['PAUSE_SCROLL', 'RESUME_SCROLL', 'GET_HARVESTED_DATA', 'CLIP_MOUSE_SELECTION'].includes(message?.action)) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs && tabs[0]?.id;
      if (!tabId) {
        sendResponse({ success: false, error: 'No active tab' });
        return;
      }
      chrome.tabs.sendMessage(tabId, message, (res) => {
        sendResponse(res || { success: true });
      });
    });
    return true;
  }

  if (message?.action === 'PING') {
    sendResponse({ status: 'PONG', time: Date.now(), version: '1.0.0' });
    return false;
  }
});
