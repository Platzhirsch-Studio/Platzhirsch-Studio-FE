// Sichtbares Testmodus-Banner des Shops (Server Component).
export default function TestBanner({ text }) {
  return (
    <div role="note" className="border-l-2 border-line-strong bg-stone px-4 py-2 text-small text-text sm:px-5 sm:py-4 [@media(max-height:500px)]:py-1.5" data-shop-testmodus="">
      {text}
    </div>
  );
}
