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
    return true; // Keep channel open for async response
  }

  if (message?.action === 'PING') {
    sendResponse({ status: 'PONG', time: Date.now(), version: '1.0.0' });
    return false;
  }
});
