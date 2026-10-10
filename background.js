// AutoSend: держит одну рабочую вкладку hh.ru.
// Когда в какой-то вкладке идёт отправка, закрывает вкладки hh.ru, которые простаивают.
// Вкладку с капчей никогда не закрывает и выводит на передний план.

const tabs = new Map(); // tabId -> { state, at }
const IDLE_GRACE_MS = 15000; // не трогаем вкладку, открытую меньше 15 секунд назад

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== "autosend:state" || !sender.tab?.id) return;
  const id = sender.tab.id;
  const prev = tabs.get(id);
  const now = Date.now();
  tabs.set(id, { state: msg.state, at: now, since: prev?.state === msg.state ? prev.since : now });

  if (msg.state === "captcha" && prev?.state !== "captcha") {
    chrome.tabs.update(id, { active: true });
    if (sender.tab.windowId !== undefined) chrome.windows.update(sender.tab.windowId, { focused: true });
  }

  const someoneWorking = [...tabs.values()].some((t) => t.state === "running" || t.state === "captcha");
  if (!someoneWorking) return;

  for (const [tabId, t] of tabs) {
    if (tabId === id && msg.state !== "idle") continue;
    if (t.state !== "idle") continue;
    if (now - t.since < IDLE_GRACE_MS) continue;
    if (now - t.at > 10000) continue; // давно не отвечала — данные устарели
    chrome.tabs.remove(tabId).catch(() => {});
    tabs.delete(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => tabs.delete(tabId));
