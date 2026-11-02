// src/lib/forms/boardCount.js
// Rat 9,5 B2 (T1 Empfang): /termin and /beratung show "Ihr Ideenboard
// (n Karten) wird angehängt". Reads the shared board (lib/ideenboard/service,
// local store, nothing from the backoffice) on the server.
//   number  → cards of the active board
//   "gone"  → unknown, revoked or expired link (the page says so, nothing attached)
//   null    → sharing not available here (no store), attach the link without count
import "server-only";
import { getSharedBoard } from "@/lib/ideenboard/service";
import { ideenboardShareAvailable } from "@/lib/ideenboard/mode";

export async function boardCardCount(shareId) {
  if (!ideenboardShareAvailable()) return null;
  try {
    const board = await getSharedBoard(shareId);
    if (!board) return "gone";
    return Array.isArray(board.cards) ? board.cards.length : null;
  } catch {
    return null;
  }
}
