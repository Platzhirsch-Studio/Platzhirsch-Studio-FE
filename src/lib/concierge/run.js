// src/lib/concierge/run.js
// The live agent loop: streams one assistant turn from Claude, runs the
// catalogue tools it asks for, and repeats until the model is done.
// Emits UI events through `emit(event)`:
//   { type: "status", label }            – "Katalog wird durchsucht …"
//   { type: "text", delta }              – streamed answer text
//   { type: "reset" }                    – drop the partial text of this round
//                                          (refusal fallback took over)
//   { type: "products", items }          – product cards (inline in the answer)
//   { type: "handoff", ... }             – "Termin anfragen" card
//   { type: "notice", message }          – soft problem shown in the answer
//   { type: "action", id, sig, kind, … } – signed website-agent PROPOSAL
//                                          (actions.js); runs only on click
//
// History arrives as plain text turns (no thinking blocks). Each request is
// therefore an append-only, thinking-free prefix: nothing for the preserved-
// thinking check to reject. Within one request the full content (incl.
// thinking and tool_use blocks) is passed back unchanged.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { EFFORT, FALLBACK_BETA, MAX_TOKENS, MAX_TOOL_ROUNDS, MODEL } from "./config";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { TOOLS, runTool } from "./tools";

const STATUS_LABEL = {
  search_products: "Katalog wird durchsucht …",
  list_categories: "Kategorien werden geladen …",
  products_in_category: "Kollektion wird zusammengestellt …",
  list_brands: "Marken werden geladen …",
  brand_overview: "Marke wird nachgeschlagen …",
  showroom_info: "Showroom-Infos …",
  request_appointment: "Übergabe an das Team …",
  propose_navigation: "Vorschlag wird vorbereitet …",
  propose_open_product: "Vorschlag wird vorbereitet …",
  propose_catalog_filter: "Katalog wird gefiltert …",
  propose_save_to_selection: "Vorschlag wird vorbereitet …",
  propose_appointment_form: "Anfrage wird vorbereitet …",
  propose_scroll_to_section: "Vorschlag wird vorbereitet …",
};

let client;
function getClient() {
  // Reads ANTHROPIC_API_KEY from the environment; never sent to the browser.
  if (!client) client = new Anthropic({ maxRetries: 2, timeout: 120_000 });
  return client;
}

// Returns { text, productIds } for optional transcript storage.
// history: model messages from prepare.js (content string or text blocks).
// env: tool environment (locale, sid, sections, surface, round counter).
export async function runLive({ history, emit, signal, env = {} }) {
  const messages = history.map((m) => ({ role: m.role, content: m.content }));
  env.round = { count: 0 };
  let fullText = "";
  const productIds = [];
  let jsonRetries = 0;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = getClient().beta.messages.stream(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        betas: [FALLBACK_BETA],
        fallbacks: "default",
        // Thinking is always on (adaptive) for this model; only effort is set.
        output_config: { effort: EFFORT },
        // Auto-caching: tools + system + history prefix are reused per turn.
        cache_control: { type: "ephemeral" },
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        tool_choice: { type: "auto" },
        messages,
      },
      { signal }
    );

    let roundText = "";
    let message;
    try {
      for await (const event of stream) {
        if (event.type === "content_block_start" && event.content_block?.type === "fallback") {
          // A declined attempt is re-run on the fallback model; its partial
          // text must not stay on screen.
          fullText = fullText.slice(0, fullText.length - roundText.length);
          roundText = "";
          emit({ type: "reset" });
        } else if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          roundText += event.delta.text;
          fullText += event.delta.text;
          emit({ type: "text", delta: event.delta.text });
        }
      }
      message = await stream.finalMessage();
      jsonRetries = 0;
    } catch (error) {
      if (error instanceof Anthropic.APIError || signal?.aborted || jsonRetries++ >= 2) throw error;
      // Tool input that could not be parsed at all: re-issue this round.
      console.warn("[concierge] unparseable tool input, retrying round");
      fullText = fullText.slice(0, fullText.length - roundText.length);
      emit({ type: "reset" });
      round--;
      continue;
    }

    if (message.stop_reason === "refusal") {
      emit({ type: "reset" });
      emit({
        type: "notice",
        message: "Dabei kann ich leider nicht helfen. Gerne beantwortet Ihnen unser Team Ihre Frage persönlich.",
      });
      return { text: fullText, productIds };
    }
    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }

    const toolUses = message.content.filter((b) => b.type === "tool_use");
    if (toolUses.length === 0) return { text: fullText, productIds }; // end_turn / max_tokens text

    if (message.stop_reason === "max_tokens") {
      // A cut-off tool input can still look valid – never run it.
      emit({ type: "notice", message: "Die Antwort wurde zu lang und abgebrochen. Bitte stellen Sie die Frage etwas enger." });
      return { text: fullText, productIds };
    }

    messages.push({ role: "assistant", content: message.content });
    if (roundText && !roundText.endsWith("\n")) {
      fullText += "\n\n";
      emit({ type: "text", delta: "\n\n" });
    }

    for (const t of toolUses) emit({ type: "status", label: STATUS_LABEL[t.name] || "Einen Moment …" });
    const results = await Promise.all(toolUses.map((t) => runTool(t.name, t.input, env)));

    // All results in ONE user message (keeps parallel tool use working).
    messages.push({
      role: "user",
      content: toolUses.map((t, i) => ({
        type: "tool_result",
        tool_use_id: t.id,
        content: results[i].content,
        ...(results[i].isError ? { is_error: true } : {}),
      })),
    });

    for (const r of results) {
      if (r.products?.length) {
        emit({ type: "products", items: r.products });
        productIds.push(...r.products.map((p) => p.id));
      }
      if (r.handoff) emit({ type: "handoff", ...r.handoff });
      if (r.action) emit(r.action);
    }
  }

  emit({ type: "notice", message: "Für diese Frage brauche ich zu viele Schritte – unser Team hilft Ihnen gerne direkt weiter." });
  return { text: fullText, productIds };
}
