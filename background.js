const MENU_ID = "mathcopy-readable";
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Copy formula as readable text",
    contexts: ["selection"]
  });
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "MATHCOPY_CONTEXT_COPY" });
  } catch (e) {
    // Some browser-owned pages do not allow content scripts.
  }
});