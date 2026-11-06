// Schnellanlage für Aufgaben (10-konzept-projekte.md § 5.14): Token im Text – @Person, #Projekt, !hoch/!niedrig,
// Datumswörter heute/morgen/übermorgen/Mo–So/TT.MM. Rest = Titel. Reines Modul (unit-getestet).

const WT = { so: 0, mo: 1, di: 2, mi: 3, do: 4, fr: 5, sa: 6 };
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * @param {string} text
 * @param {{projekte:Array<{name:string,titel:string,kurz?:string}>, leute:Array<{user:string,name:string}>, heute:string}} ctx
 * @returns {{titel:string, projekt:string, projektTitel:string, person:string, personName:string, faellig:string, prioritaet:"Normal"|"Hoch"|"Niedrig"}}
 */
export function schnellanlage(text, { projekte = [], leute = [], heute } = {}) {
  let rest = ` ${String(text || "")} `;
  const out = { titel: "", projekt: "", projektTitel: "", person: "", personName: "", faellig: "", prioritaet: "Normal" };
  const basis = new Date(`${heute || new Date().toISOString().slice(0, 10)}T12:00:00`);
  // #Projekt: längster passender Titel/Kurzname nach dem #
  const hash = /#([^@#!]+?)(?=\s(?:@|!|#|heute|morgen|übermorgen|uebermorgen|mo|di|mi|do|fr|sa|so|\d{1,2}\.\d{1,2}\.)\b|\s*$)/i.exec(rest);
  if (hash) {
    const woerter = hash[1].trim().split(/\s+/);
    let rueck = hash[1];
    for (let k = woerter.length; k >= 1; k--) {
      const q = woerter.slice(0, k).join(" ").toLowerCase();
      const p = projekte.find((x) => x.titel.toLowerCase() === q || x.name.toLowerCase() === q || (x.kurz || "").toLowerCase() === q) || (k === 1 ? projekte.find((x) => x.titel.toLowerCase().startsWith(q) || x.name.toLowerCase().includes(q)) : null);
      if (p) {
        out.projekt = p.name;
        out.projektTitel = p.titel;
        rueck = woerter.slice(k).join(" ");
        break;
      }
    }
    rest = rest.replace(hash[0], ` ${out.projekt ? rueck : ""} `);
  }
  const at = /@(\S+)/.exec(rest);
  if (at) {
    const q = at[1].toLowerCase();
    const l = leute.find((x) => x.name.toLowerCase().split(/\s+/).some((t) => t.startsWith(q)) || x.user.toLowerCase().startsWith(q));
    if (l) {
      out.person = l.user;
      out.personName = l.name;
    }
    rest = rest.replace(at[0], " ");
  }
  const prio = /!(hoch|niedrig)\b/i.exec(rest);
  if (prio) {
    out.prioritaet = prio[1].toLowerCase() === "hoch" ? "Hoch" : "Niedrig";
    rest = rest.replace(prio[0], " ");
  }
  const datum = /\s(heute|morgen|übermorgen|uebermorgen|mo|di|mi|do|fr|sa|so|(\d{1,2})\.(\d{1,2})\.(\d{2,4})?)(?=\s)/i.exec(rest);
  if (datum) {
    const w = datum[1].toLowerCase();
    const d = new Date(basis);
    if (w === "morgen") d.setDate(d.getDate() + 1);
    else if (w === "übermorgen" || w === "uebermorgen") d.setDate(d.getDate() + 2);
    else if (w in WT) d.setDate(d.getDate() + (((WT[w] - d.getDay() + 7) % 7) || 7));
    else if (datum[2]) {
      d.setMonth(Number(datum[3]) - 1, Number(datum[2]));
      if (datum[4]) d.setFullYear(Number(datum[4].length === 2 ? `20${datum[4]}` : datum[4]));
      else if (iso(d) < iso(basis)) d.setFullYear(d.getFullYear() + 1);
    }
    out.faellig = iso(d);
    rest = rest.replace(datum[0], " ");
  }
  out.titel = rest.replace(/\s+/g, " ").trim().slice(0, 140);
  return out;
}
