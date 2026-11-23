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

  // Background AI Model Auto-Sync & Cache Query
  if (message?.action === 'SYNC_AI_MODELS' || message?.action === 'CHECK_MODEL_CACHE') {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['zundeck_ai_models_cache'], (res) => {
        const cache = res?.zundeck_ai_models_cache || {};
        sendResponse({ success: true, timestamp: Date.now(), cache });
      });
      return true;
    }
    sendResponse({ success: true, timestamp: Date.now() });
    return false;
  }

  if (message?.action === 'PING') {
    sendResponse({ status: 'PONG', time: Date.now(), version: '1.0.0' });
    return false;
  }
});

// Periodic 6-hour cache check if alarms API is present in browser runtime
if (typeof chrome !== 'undefined' && chrome.alarms) {
  try {
    chrome.alarms.create('zundeck-model-sync-alarm', { periodInMinutes: 360 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'zundeck-model-sync-alarm') {
        // Event-based revalidation trigger
      }
    });
  } catch {
    // Graceful fallback when alarms permission is omitted
  }
}
