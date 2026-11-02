"use client";
// Vorführung auf /de/ki-assistenten: ruft ein Werkzeug über den echten
// MCP-Server auf (callAgentTool → /api/agent/mcp) und zeigt Anfrage und
// Antwort, lesbar oder als JSON. Startzustand kommt vom Server (showroom_info,
// ohne Netzwerk), damit die Seite sofort etwas zeigt und kein Aufruf beim
// Laden passiert. Rückmeldung ≤ 100 ms (Knopf gedrückt, Status „Frage wird
// gestellt …“), Ergebnis in einer Live-Region. Keine Animation außer Farbe.
import { useRef, useState } from "react";
import cx from "@/components/ui/cx";
import { DEMO } from "@/lib/agent/copy";
import { callAgentTool, toolCallRequest } from "@/lib/agent/client";

const DIM_LABEL = { width: "B", depth: "T", height: "H", diameter: "Ø", length: "L" };

export function dimensionLine(d) {
  if (!d) return null;
  const parts = Object.entries(DIM_LABEL)
    .filter(([k]) => typeof d[k] === "number")
    .map(([k, l]) => `${l} ${String(d[k]).replace(".", ",")}`);
  if (parts.length) return `${parts.join(" · ")} ${d.unit || "cm"}`;
  return d.text || null;
}

function Products({ items }) {
  return (
    <ul className="grid gap-px bg-line-inverse sm:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => (
        <li key={p.url} className="min-w-0 bg-surface-inverse p-4">
          <p className="text-overline uppercase text-text-inverse-soft">{p.brand}</p>
          <p className="mt-1 text-ui text-text-inverse">{p.name}</p>
          <p className="mt-2 text-small text-text-inverse-soft tabular">{dimensionLine(p.dimensions) || DEMO.noDimensions}</p>
          <p className="mt-1 text-small text-text-inverse-soft">
            {DEMO.price}: {p.price}
          </p>
          <a href={new URL(p.url).pathname} className="mt-3 inline-flex min-h-11 items-center text-small text-text-inverse underline decoration-line-inverse underline-offset-4 hover:decoration-current">
            {DEMO.open}
            <span className="sr-only">: {p.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Readable({ tool, data }) {
  if (!data) return null;
  if (data.error) return <p className="text-body text-text-inverse">{data.message}</p>;
  if (data.products) {
    return (
      <div className="space-y-3">
        {data.category && (
          <p className="text-small text-text-inverse-soft">
            {data.category}: {data.total} Produkte · {data.brands?.map((b) => `${b.name} ${b.products}`).join(" · ")}
          </p>
        )}
        {data.products.length ? <Products items={data.products} /> : <p className="text-body text-text-inverse">{data.hint}</p>}
      </div>
    );
  }
  if (tool === "showroom_info") {
    return (
      <dl className="grid gap-x-6 gap-y-2 text-body sm:grid-cols-[9rem_1fr]">
        <dt className="text-text-inverse-soft">Adresse</dt>
        <dd className="text-text-inverse">{data.address?.line}</dd>
        {data.openingHours?.map((h) => (
          <div key={h.days} className="contents">
            <dt className="text-text-inverse-soft">{h.days}</dt>
            <dd className="text-text-inverse tabular">{h.time}</dd>
          </div>
        ))}
        <dt className="text-text-inverse-soft">Telefon</dt>
        <dd className="text-text-inverse tabular">{data.phone}</dd>
        <dt className="text-text-inverse-soft">Café</dt>
        <dd className="text-text-inverse">{data.cafe}</dd>
      </dl>
    );
  }
  if (tool === "arbeitsweise") {
    return (
      <ol className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {data.steps?.map((s) => (
          <li key={s.step} className="border-t border-line-inverse pt-3">
            <p className="text-ui text-text-inverse">
              <span className="tabular text-text-inverse-soft">{String(s.step).padStart(2, "0")} </span>
              {s.name}
            </p>
            <p className="mt-1 line-clamp-3 text-small text-text-inverse-soft">{s.text}</p>
          </li>
        ))}
      </ol>
    );
  }
  if (tool === "ezarri_collections") {
    return (
      <div className="space-y-3">
        <p className="text-small text-text-inverse-soft">{data.line}</p>
        <ul className="grid gap-px bg-line-inverse sm:grid-cols-2 xl:grid-cols-3">
          {data.collections?.slice(0, 6).map((c) => (
            <li key={c.id} className="bg-surface-inverse p-4">
              <p className="text-ui text-text-inverse">{c.name}</p>
              <p className="mt-1 text-small text-text-inverse-soft">
                {c.mosaike} Mosaike · {c.formate.join(", ")} · {DEMO.price}: {c.price}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-small text-text-inverse-soft">{data.sourceNote}</p>
      </div>
    );
  }
  return null;
}

export default function ToolDemo({ initial }) {
  const [active, setActive] = useState(0);
  const [view, setView] = useState("readable");
  const [state, setState] = useState({
    status: "done",
    tool: initial.tool,
    request: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: initial.tool, arguments: initial.args } },
    result: initial.result,
  });
  const ctrl = useRef(null);

  async function ask(i) {
    const p = DEMO.prompts[i];
    setActive(i);
    ctrl.current?.abort();
    const controller = new AbortController();
    ctrl.current = controller;
    setState({ status: "loading", tool: p.tool, request: toolCallRequest(p.tool, p.args), result: null });
    try {
      const out = await callAgentTool(p.tool, p.args, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!out.result) {
        setState({ status: out.status === 429 ? "rate" : "error", tool: p.tool, request: out.request, result: null, response: out.response });
        return;
      }
      setState({ status: "done", tool: p.tool, request: out.request, result: out.result });
    } catch {
      /* abgebrochen: neue Frage läuft */
    }
  }

  const data = state.result?.structuredContent;
  // JSON-Ansicht: content[0].text ist dieselbe Antwort als Text – gekürzt, damit structuredContent lesbar bleibt.
  const shortText = (t) => (t && t.length > 90 ? `${t.slice(0, 90)} … (${t.length} Zeichen, gleicher Inhalt wie structuredContent)` : t);
  const response = state.result
    ? { jsonrpc: "2.0", id: state.request.id, result: { ...state.result, content: state.result.content?.map((c) => ({ ...c, text: shortText(c.text) })) } }
    : state.response || null;

  return (
    <div className="mt-10">
      <div role="group" aria-label="Beispielfragen" className="flex flex-wrap gap-2">
        {DEMO.prompts.map((p, i) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={active === i}
            onClick={() => ask(i)}
            className={cx(
              "min-h-11 border px-4 text-ui transition-colors duration-(--duration-micro) ease-quiet",
              active === i ? "border-paper bg-paper text-ink" : "border-line-inverse text-text-inverse hover:border-paper"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-4">
          <p className="text-overline uppercase text-accent-on-dark">{DEMO.request}</p>
          {/* Mobil eine Zeile, ab lg die ganze JSON-RPC-Nachricht */}
          <p className="mt-3 break-all font-mono text-small text-text-inverse-soft lg:hidden" translate="no">
            tools/call → {state.request.params.name} {JSON.stringify(state.request.params.arguments)}
          </p>
          <pre className="mt-3 hidden max-w-full overflow-x-auto border border-line-inverse p-4 text-small text-text-inverse-soft lg:block" tabIndex={0} aria-label={DEMO.request}>
            <code className="font-mono" translate="no">
              {JSON.stringify(state.request, null, 2)}
            </code>
          </pre>
        </div>
        <div className="min-w-0 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-overline uppercase text-accent-on-dark">{DEMO.response}</p>
            <div role="group" aria-label="Ansicht" className="flex">
              {[
                ["readable", DEMO.readable],
                ["raw", DEMO.raw],
              ].map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={view === k}
                  onClick={() => setView(k)}
                  className={cx("min-h-11 min-w-16 border px-3 text-small", view === k ? "border-paper bg-paper text-ink" : "border-line-inverse text-text-inverse hover:border-paper")}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div aria-live="polite" aria-busy={state.status === "loading"} className="mt-3 min-h-48 border border-line-inverse p-4" data-demo-result={state.status}>
            {state.status === "loading" && <p className="text-body text-text-inverse-soft">{DEMO.loading}</p>}
            {state.status === "error" && <p className="text-body text-text-inverse">{DEMO.error}</p>}
            {state.status === "rate" && <p className="text-body text-text-inverse">{DEMO.rateLimited}</p>}
            {state.status === "done" &&
              (view === "raw" ? (
                <pre className="max-h-[28rem] max-w-full overflow-auto text-small text-text-inverse-soft" tabIndex={0} aria-label={DEMO.raw}>
                  <code className="font-mono" translate="no">
                    {JSON.stringify(response, null, 2)}
                  </code>
                </pre>
              ) : (
                <Readable tool={state.tool} data={data} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
