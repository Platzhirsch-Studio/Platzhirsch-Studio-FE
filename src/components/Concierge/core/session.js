// Conversation and consent token of the sitewide concierge in sessionStorage:
// survives client navigation (the launcher stays mounted in the layout) and a
// reload in the same tab, gone with the tab. All access in try/catch – without
// storage the chat lives in memory only.
const CHAT_KEY = "ph-concierge:chat";
// Own key, not the Labs one: the sitewide consent text also covers the page
// context, so a Labs consent does not carry over.
const TOKEN_KEY = "ph-concierge:site-token";
const MAX_MESSAGES = 40;

export function loadChat() {
  try {
    const v = JSON.parse(sessionStorage.getItem(CHAT_KEY) || "null");
    if (v?.v === 1 && Array.isArray(v.messages)) return { messages: v.messages, resume: Boolean(v.resume) };
  } catch {
    /* blocked or broken */
  }
  return { messages: [], resume: false };
}

export function saveChat(messages, { resume = false } = {}) {
  try {
    if (!messages.length && !resume) sessionStorage.removeItem(CHAT_KEY);
    else sessionStorage.setItem(CHAT_KEY, JSON.stringify({ v: 1, resume, messages: messages.slice(-MAX_MESSAGES) }));
  } catch {
    /* quota or blocked */
  }
}

/** Set before a full page load caused by an action: show "Gespräch fortsetzen" after it. */
export function markResume() {
  try {
    const v = JSON.parse(sessionStorage.getItem(CHAT_KEY) || "null") || { v: 1, messages: [] };
    sessionStorage.setItem(CHAT_KEY, JSON.stringify({ ...v, v: 1, resume: true }));
  } catch {
    /* nothing */
  }
}

export function takeResume() {
  try {
    const v = JSON.parse(sessionStorage.getItem(CHAT_KEY) || "null");
    if (!v?.resume) return false;
    sessionStorage.setItem(CHAT_KEY, JSON.stringify({ ...v, resume: false }));
    return true;
  } catch {
    return false;
  }
}

export function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* memory only */
  }
}
