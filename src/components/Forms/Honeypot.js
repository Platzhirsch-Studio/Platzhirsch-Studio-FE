/**
 * Honeypot `website` of the form contract (R1-formulare). Invisible for
 * people (moved out of view, NOT display:none, so simple bots still fill it),
 * hidden from assistive technology, not reachable with Tab, no autofill.
 * Uncontrolled: useFormGuard() reads its value from the form on submit.
 * Must sit inside the <form>. Server-safe.
 * @param {string} [id] unique per page if a page has several forms
 */
export default function Honeypot({ id = "website-hp" }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0">
      <label htmlFor={id}>Website</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}
