"use client";
import { useActionState } from "react";
import { geraetRegistrierenAction } from "@/lib/backoffice/actions";
import Knopf from "@/components/Backoffice/Knopf";

export default function GeraetForm({ typen, kassen }) {
  const [state, action, pending] = useActionState(geraetRegistrierenAction, null);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {state && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "rounded-bo bg-bo-ok/10 px-3 py-2 text-sm sm:col-span-2" : "rounded-bo bg-bo-danger/10 px-3 py-2 text-sm text-bo-danger sm:col-span-2"}>
          {state.message}
        </p>
      )}
      <div>
        <label htmlFor="g-name" className="mb-1 block text-xs font-medium text-bo-text-soft">
          Gerätename *
        </label>
        <input id="g-name" name="name" required maxLength={80} className="bo-input min-h-11" placeholder="iPad Kassa 1" />
      </div>
      <div>
        <label htmlFor="g-standort" className="mb-1 block text-xs font-medium text-bo-text-soft">
          Standort *
        </label>
        <input id="g-standort" name="standort" required maxLength={80} className="bo-input min-h-11" defaultValue="Lochau" />
      </div>
      <div>
        <label htmlFor="g-typ" className="mb-1 block text-xs font-medium text-bo-text-soft">
          Typ *
        </label>
        <select id="g-typ" name="typ" required className="bo-input min-h-11">
          {typen.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.titel}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="g-kasse" className="mb-1 block text-xs font-medium text-bo-text-soft">
          Kasse
        </label>
        <select id="g-kasse" name="kasse" className="bo-input min-h-11">
          <option value="">– keine –</option>
          {kassen.map((k) => (
            <option key={k.name} value={k.name}>
              {k.bezeichnung || k.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="g-drucker" className="mb-1 block text-xs font-medium text-bo-text-soft">
          Drucker (Name/Adresse)
        </label>
        <input id="g-drucker" name="drucker" maxLength={80} className="bo-input min-h-11" placeholder="Bondrucker Kassa 1" />
      </div>
      <div className="sm:col-span-2">
        <Knopf type="submit" variant="primary" size="l" disabled={pending}>
          {pending ? "Speichert …" : "Gerät registrieren"}
        </Knopf>
      </div>
    </form>
  );
}
