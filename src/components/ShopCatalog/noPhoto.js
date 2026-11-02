// R5-produkt (P1): neutral surface for a product without a backoffice photo –
// no motif, only a brass hairline (functional line token) and the hint text
// ("Für dieses Stück liegt noch kein Foto vor"). The product stage passes the
// wordmark as `mark` (server page); the client catalogue does not, so the
// 13 KB wordmark path never lands in its bundle or in every tile's HTML.
// The hint is real text (not an alt), so screen readers read it in place of a
// picture. Box/aspect come from the caller (`className`): the stage keeps the
// gallery's 3:2, the tile its 3:2 box.
// data-no-photo: hook for the QA counter script and the e2e spec.
// Server-safe (no hooks) – usable from the client catalogue and server pages.
export default function NoPhoto({ label, mark = null, className = "" }) {
  return (
    <div data-no-photo="" className={`flex flex-col items-center justify-center gap-3 bg-linen px-6 text-center ${className}`}>
      {mark}
      <span aria-hidden="true" className="block h-px w-10 bg-brass-500" />
      <p className="max-w-[26ch] text-small text-text-soft">{label}</p>
    </div>
  );
}
