"use client";
import { useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { BRAND_NOTE, coverMeta } from "../../../lib/sofaplaner/covers.js";
import { sourceCopy } from "../../../lib/sofaplaner/copy/source.js";
import { useT } from "./useT";
import { MATERIALS, materialsFor } from "../../../lib/sofaplaner/materials.js";
import { availability, backGroups } from "../../../lib/sofaplaner/options.js";
import { useNarrow } from "./storage";
import s from "./sofaplaner.module.css";

// Expert mode: the manufacturer term. English page: the English label already
// is the manufacturer term or our translation – the German original is shown
// when the label had to stay German (o.de, lang="de").
const enOf = (o, expert, T) => (expert && o.labelEn && !T?.foreign ? <span className={s.optDetail}>{T ? T("Herstellerbegriff:") : "Herstellerbegriff:"} {o.labelEn}</span> : null);
/** lang attribute for a text that stayed German on the English page. */
const deLang = (flag) => (flag ? "de" : undefined);

function Choice({ name, legend, hint, options, value, onChange, none, expert }) {
  const T = useT();
  if (!options.length) return null;
  if (options.length === 1) {
    return (
      <div className={s.fieldset}>
        <p className={s.legend}>{legend}</p>
        <p className={s.optFixed}>
          <strong lang={deLang(options[0].de)}>{options[0].label}</strong>
          {options[0].detail && <span className={s.small} lang={deLang(options[0].detailDe)}> {options[0].detail}</span>}
          {enOf(options[0], expert, T)}
        </p>
        {hint && <p className={s.small}>{hint}</p>}
      </div>
    );
  }
  return (
    <fieldset className={s.fieldset}>
      <legend>{legend}</legend>
      {none && (
        <label className={s.radio}>
          <input type="radio" name={name} checked={!value} onChange={() => onChange("")} />
          <span>{none}</span>
        </label>
      )}
      {options.map((o) => (
        <label key={o.id} className={s.radio}>
          <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} />
          <span>
            <strong lang={deLang(o.de)}>{o.label}</strong>
            {o.detail && <span className={s.optDetail} lang={deLang(o.detailDe)}>{o.detail}</span>}
            {enOf(o, expert, T)}
          </span>
        </label>
      ))}
      {hint && <p className={s.small}>{hint}</p>}
    </fieldset>
  );
}

// QM R1 P2-3: the basic back is ONE choice (radio); headrests and back cushions
// are optional extras (checkboxes). Options that the manufacturer lists only
// for certain elements name them and are greyed out without such an element.
function BackChoice({ options, value, onChange, expert, familyElements, planElements }) {
  const T = useT();
  if (!options.length) return null;
  const { base, addons } = backGroups(options);
  const chosen = new Set(value);
  const baseId = base.find((o) => chosen.has(o.id))?.id || "";
  const setBase = (id) => onChange([...(id ? [id] : []), ...value.filter((v) => !base.some((o) => o.id === v))]);
  const toggle = (id, on) => onChange(on ? [...value.filter((v) => v !== id), id] : value.filter((v) => v !== id));
  const row = (o, type, checked, onSel) => {
    const av = availability(o, familyElements, planElements);
    const off = av.available === false && !checked;
    const descId = `sp-av-${o.id}`;
    return (
      <label key={o.id} className={`${s.radio} ${off ? s.optOff : ""}`}>
        <input
          type={type}
          name={type === "radio" ? "back" : undefined}
          checked={checked}
          disabled={off}
          aria-describedby={av.available !== null ? descId : undefined}
          onChange={(e) => onSel(e.target.checked)}
        />
        <span>
          <strong lang={deLang(o.de)}>{o.label}</strong>
          {o.detail && <span className={s.optDetail} lang={deLang(o.detailDe)}>{o.detail}</span>}
          {av.available !== null && (
            <span id={descId} className={s.optDetail}>
              {T(av.available ? "Nur für: {scope} – im Plan vorhanden." : "Nur für: {scope} – im Plan ist kein passendes Element.", { scope: av.scope })}
            </span>
          )}
          {enOf(o, expert, T)}
        </span>
      </label>
    );
  };
  return (
    <>
      {base.length > 1 ? (
        <fieldset className={s.fieldset}>
          <legend>{T("Rücken")}</legend>
          <label className={s.radio}>
            <input type="radio" name="back" checked={!baseId} onChange={() => setBase("")} />
            <span>{T("Im Showroom entscheiden")}</span>
          </label>
          {base.map((o) => row(o, "radio", baseId === o.id, () => setBase(o.id)))}
          <p className={s.small}>{T("Eine Rückenart je Sofa.")}</p>
        </fieldset>
      ) : base.length === 1 ? (
        <div className={s.fieldset}>
          <p className={s.legend}>{T("Rücken")}</p>
          <p className={s.optFixed}>
            <strong lang={deLang(base[0].de)}>{base[0].label}</strong>
            {base[0].detail && <span className={s.small} lang={deLang(base[0].detailDe)}> {base[0].detail}</span>}
            {enOf(base[0], expert, T)}
          </p>
        </div>
      ) : null}
      {addons.length > 0 && (
        <fieldset className={s.fieldset}>
          <legend>{T("Zusätzlich zum Rücken (optional)")}</legend>
          {addons.map((o) => row(o, "checkbox", chosen.has(o.id), (on) => toggle(o.id, on)))}
          <p className={s.small}>{T("Mehrfachauswahl möglich, z. B. Kopfstütze und Rückenkissen.")}</p>
        </fieldset>
      )}
    </>
  );
}

// QM R1 P2-7 / R2 P2-C: Minotti cover materials with source – from the
// research file and the model's own product page, then the brand-wide
// statements (marked as such). Name, material and category only.
function CollItem({ c }) {
  const T = useT();
  return (
    <li lang={deLang(c.de)}>
      {/* QM r5: keine doppelten Angaben („Stoff · Stoff · …“) */}
      <strong>{c.name}</strong>{coverMeta(c).length > 0 && <span className={s.muted}> · {coverMeta(c).join(" · ")}</span>}
      {c.source && (
        <>
          {/* QM r3: Trenner vor „Quelle“ (vorher „Kategorie Nature Quelle“) */}
          <span className={s.muted} aria-hidden="true">{" · "}</span>
          <a className={s.srcLink} href={c.source} target="_blank" rel="noopener noreferrer">
            {T("Quelle")}<span className={s.srOnly}>{T(" (minotti.com, neues Fenster)")}</span>
          </a>
        </>
      )}
    </li>
  );
}
function CoverCollections({ list, brand = [] }) {
  const T = useT();
  const SC = sourceCopy(T.locale);
  // R2 neuland P0-1: neutral planning types have no manufacturer collections
  if (!SC.brand) {
    return (
      <div className={s.collections}>
        <p className={s.legend}>{T("Bezüge")}</p>
        <p className={s.small}>{SC.showroom} {T("Bildschirmfarben sind unverbindlich.")}</p>
      </div>
    );
  }
  return (
    <div className={s.collections}>
      <p className={s.legend}>{T("Bezugskollektionen laut Hersteller")}</p>
      {list.length ? (
        <ul className={s.collList} data-covers="model">
          {list.map((c) => (
            <CollItem key={c.name} c={c} />
          ))}
        </ul>
      ) : (
        <p className={s.small}>{T("Auf der Produktseite dieses Modells nennt Minotti keine Bezugsnamen.")}</p>
      )}
      {brand.length > 0 && (
        <details className={s.more}>
          <summary>{T("Weitere Materialien der Minotti-Kollektion ({n})", { n: brand.length })}</summary>
          <p className={s.small}>{T(BRAND_NOTE)}</p>
          <ul className={s.collList} data-covers="brand">
            {brand.map((c) => (
              <CollItem key={c.name} c={c} />
            ))}
          </ul>
        </details>
      )}
      <p className={s.small}>{T("Die vollständige Material- und Farbbibliothek stellt Minotti nur mit Fach-Login bereit. Farben und Muster zeigen wir im Showroom – Bildschirmfarben sind laut Hersteller unverbindlich.")}</p>
    </div>
  );
}

// QM R2 P2-D: option groups as an accordion with the current choice in the
// head. Phones/tablets start with only the first group open; desktop opens all.
function Group({ id, title, value, open, onToggle, children }) {
  return (
    <details className={s.optGroup} open={open} onToggle={(e) => onToggle(id, e.currentTarget.open)} data-group={id}>
      <summary className={s.optHead}>
        <span className={s.optHeadText}>
          <span className={s.optTitle}>{title}</span>
          {value && <span className={s.optValue}>{value}</span>}
        </span>
        <ChevronDown size={18} aria-hidden="true" className={s.chevron} />
      </summary>
      <div className={s.optBody}>{children}</div>
    </details>
  );
}
const CUSHIONS_SHORT = 6;

// id = the stored (German) value; label = English text where the family is localized
const strOpts = (list, en = null, de = null) => list.map((l, i) => ({ id: l, label: en?.[i] ?? l, de: de?.[i] || undefined, detail: null, key: i }));

/** Step 4 „Ausführung“ – only the options the manufacturer lists for this model. */
export default function LookPanel({ family, look, onChange, expert = false, planElements = [] }) {
  const T = useT();
  const o = family.options;
  const mats = materialsFor(family);
  const set = (patch) => onChange((l) => ({ ...l, ...patch }));
  const accessories = family.elements.filter((e) => e.role === "acc");
  const qty = (id) => look.cushions.find((c) => c.id === id)?.q || 0;
  const setQty = (id, q) =>
    set({ cushions: [...look.cushions.filter((c) => c.id !== id), ...(q > 0 ? [{ id, q: Math.min(20, q) }] : [])] });
  const cushionRows = [
    ...o.cushions.map((c) => ({ id: c.id, label: c.label, detail: c.detail, labelEn: c.labelEn, de: c.de, detailDe: c.detailDe })),
    ...accessories.map((e) => ({ id: e.code, label: e.label, detail: [e.w && `${T.cm(e.w)}${e.d ? ` × ${T.cm(e.d)}` : ""}${e.h ? ` × H ${T.cm(e.h)}` : ""} cm`].filter(Boolean).join("") || null })),
  ];
  const mat = MATERIALS[look.material] || MATERIALS[mats[0]];
  const tone = mat.tones.find(([k]) => k === look.tone)?.[1];

  const hasCoverOpts = o.cover.types.length > 0 || o.cover.variants.length > 0;
  const groups = [
    "bezug",
    hasCoverOpts && "bezugsart",
    o.back.length > 0 && "ruecken",
    o.arm.length > 0 && "arm",
    o.base.length > 0 && "sockel",
    cushionRows.length > 0 && "kissen",
    (o.padding.length > 0 || o.cover.notes.length > 0) && "polster",
  ].filter(Boolean);

  // accordion: until the first toggle all groups are open on desktop; phones and
  // tablets start with only the first group open (QM R2 P2-D)
  const narrow = useNarrow();
  const [openIds, setOpenIds] = useState(null);
  const [allCushions, setAllCushions] = useState(false);
  const initial = () => new Set(narrow ? ["bezug"] : groups);
  const isOpen = (id) => (openIds || initial()).has(id);
  // the browser also fires "toggle" when a group is rendered open – no state
  // update then (React warns about updates before mount)
  const toggle = (id, open) =>
    isOpen(id) !== open &&
    setOpenIds((cur) => {
      const now = cur || initial();
      if (now.has(id) === open) return cur;
      const n = new Set(now);
      if (open) n.add(id);
      else n.delete(id);
      return n;
    });

  const labelOf = (list, id) => list.find((x) => x.id === id)?.label;
  const one = (list, v) => (list.length === 1 ? list[0].label : labelOf(list, v) || T("Im Showroom entscheiden"));
  const { base: backBase } = backGroups(o.back);
  const backSel = backBase.find((b) => look.back.includes(b.id));
  const backExtras = look.back.filter((id) => !backBase.some((b) => b.id === id)).length;
  const backValue =
    (backBase.length === 1 ? backBase[0].label : backSel?.label || T("Im Showroom entscheiden")) + (backExtras ? ` + ${T(backExtras > 1 ? "{n} Zusatzoptionen" : "{n} Zusatzoption", { n: backExtras })}` : "");
  const cushionCount = look.cushions.reduce((n, c) => n + c.q, 0);
  const enOfValue = (list, en, v) => (en && v ? en[list.indexOf(v)] ?? v : v);
  const coverValue = [enOfValue(o.cover.types, o.cover.typesEn, look.coverType), enOfValue(o.cover.variants, o.cover.variantsEn, look.variant)].filter(Boolean).join(" · ") || T("Im Showroom entscheiden");
  const shortList = !allCushions && cushionRows.length > CUSHIONS_SHORT + 1;
  const rows = shortList ? cushionRows.slice(0, CUSHIONS_SHORT) : cushionRows;

  return (
    <div className={s.optStack}>
      <Group id="bezug" title={T("Bezug")} value={`${T(mat.label)}${tone ? `, ${T(tone)}` : ""}`} open={isOpen("bezug")} onToggle={toggle}>
        <fieldset className={s.fieldsetFlat}>
          <legend>{T("Bezug: Materialfamilie")}</legend>
          <div className={s.chips} role="radiogroup" aria-label={T("Materialfamilie")}>
            {mats.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={look.material === k} className={s.chip} onClick={() => set({ material: k, tone: MATERIALS[k].tones[1]?.[0] || MATERIALS[k].tones[0][0] })}>
                {T(MATERIALS[k].label)}
              </button>
            ))}
          </div>
          <p className={s.small}>{T(mat.hint)}</p>
          {o.cover.categories.length > 0 && <p className={s.small} lang={deLang(o.cover.categoriesDe)}>{T("Laut Hersteller verfügbar:")} {o.cover.categories.join(" · ")}</p>}
          <div className={s.swatches} role="radiogroup" aria-label={T("Farbton")}>
            {mat.tones.map(([key, label, hex]) => (
              <button key={key} type="button" role="radio" aria-checked={look.tone === key} className={s.swatch} onClick={() => set({ tone: key })}>
                <span className={s.swatchDot} style={{ background: hex }} aria-hidden="true" />
                {T(label)}
              </button>
            ))}
          </div>
          <p className={s.small}>{T("Neutrale Farbtöne für die Vorschau – keine Herstellerfarben.")}</p>
          <CoverCollections list={o.cover.collections || []} brand={o.cover.brand || []} />
        </fieldset>
      </Group>

      {hasCoverOpts && (
        <Group id="bezugsart" title={T("Bezugsart")} value={coverValue} open={isOpen("bezugsart")} onToggle={toggle}>
          <Choice name="coverType" legend={T("Bezugsart")} options={strOpts(o.cover.types, o.cover.typesEn, o.cover.typesDe)} value={look.coverType} onChange={(v) => set({ coverType: v })} none={T("Im Showroom entscheiden")} />
          <Choice name="variant" legend={T("Ausführung des Bezugs")} options={strOpts(o.cover.variants, o.cover.variantsEn, o.cover.variantsDe)} value={look.variant} onChange={(v) => set({ variant: v })} none={T("Im Showroom entscheiden")} />
        </Group>
      )}
      {o.back.length > 0 && (
        <Group id="ruecken" title={T("Rückenlehne")} value={backValue} open={isOpen("ruecken")} onToggle={toggle}>
          <BackChoice options={o.back} value={look.back} onChange={(v) => set({ back: v })} expert={expert} familyElements={family.elements} planElements={planElements} />
        </Group>
      )}
      {o.arm.length > 0 && (
        <Group id="arm" title={T("Armlehnen")} value={one(o.arm, look.arm)} open={isOpen("arm")} onToggle={toggle}>
          <Choice name="arm" legend={T("Armlehne")} options={o.arm} value={look.arm} onChange={(v) => set({ arm: v })} none={T("Im Showroom entscheiden")} expert={expert} />
        </Group>
      )}
      {o.base.length > 0 && (
        <Group id="sockel" title={T("Sockel & Füße")} value={one(o.base, look.base)} open={isOpen("sockel")} onToggle={toggle}>
          <Choice name="base" legend={T("Sockel und Füße")} options={o.base} value={look.base} onChange={(v) => set({ base: v })} none={T("Im Showroom entscheiden")} expert={expert} hint={T("Die Wahl färbt den Sockel in der 3D-Vorschau (neutral: dunkel, Metall hell oder Holz).")} />
        </Group>
      )}

      {cushionRows.length > 0 && (
        <Group id="kissen" title={T("Kissen & Zubehör")} value={cushionCount ? T("{n} Stück gewählt", { n: cushionCount }) : T("Keine gewählt")} open={isOpen("kissen")} onToggle={toggle}>
          <fieldset className={s.fieldsetFlat}>
            <legend>{T("Kissen und Zubehör")}</legend>
            <ul className={s.qtyList}>
              {rows.map((c) => (
                <li key={c.id} className={s.qtyRow}>
                  <span>
                    <strong lang={deLang(c.de)}>{c.label}</strong>
                    {c.detail && <span className={s.optDetail} lang={deLang(c.detailDe)}>{c.detail}</span>}
                    {enOf(c, expert, T)}
                  </span>
                  <span className={s.qty}>
                    <button type="button" className={s.iconBtn} onClick={() => setQty(c.id, qty(c.id) - 1)} disabled={!qty(c.id)} aria-label={T("{label}: eins weniger", { label: c.label })}>
                      <Minus size={16} aria-hidden="true" />
                    </button>
                    <output aria-live="polite" aria-label={T("Anzahl {label}", { label: c.label })}>{qty(c.id)}</output>
                    <button type="button" className={s.iconBtn} onClick={() => setQty(c.id, qty(c.id) + 1)} aria-label={T("{label}: eins mehr", { label: c.label })}>
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            {shortList && (
              <button type="button" className={s.btnGhost} onClick={() => setAllCushions(true)}>
                {T("Alle {n} zeigen", { n: cushionRows.length })}
              </button>
            )}
          </fieldset>
        </Group>
      )}

      {(o.padding.length > 0 || o.cover.notes.length > 0) && (
        <Group id="polster" title={T("Polsterung & Herstellerangaben")} value={null} open={isOpen("polster")} onToggle={toggle}>
          {o.padding.length > 0 && (
            <div className={s.fieldsetFlat}>
              <p className={s.legend}>{T("Polsterung (laut Hersteller)")}</p>
              <ul className={s.plainList}>
                {o.padding.map((p) => (
                  <li key={p.id} lang={deLang(p.de || p.detailDe)}>
                    {p.detailDe ? p.labelDe || p.label : p.label}
                    {p.detail ? ` – ${p.detail}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {o.cover.notes.length > 0 && (
            <div className={s.fieldsetFlat}>
              <p className={s.legend}>{T("Weitere Herstellerangaben zum Bezug")}</p>
              <ul className={s.plainList}>
                {o.cover.notes.map((n, i) => (
                  <li key={i} lang={deLang(o.cover.notesDe?.[i])}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </Group>
      )}
      <p className={s.small}>{T("Bezeichnungen aus den öffentlichen Unterlagen des Herstellers. Welche Optionen sich kombinieren lassen, klären wir im Showroom.")}</p>
      {T.foreign && <p className={s.small}>{T("Angaben in deutscher Sprache stammen aus unseren Notizen zu den Unterlagen von Minotti; die englischen Originale verlinkt die Übersicht unter „Quellen“.")}</p>}
    </div>
  );
}
