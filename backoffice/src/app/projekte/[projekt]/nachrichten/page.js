import { redirect } from "next/navigation";

/** Alter Pfad (§ 3.1) → Auftragsmappe (307). */
export default async function Umleitung({ params }) {
  const { projekt } = await params;
  redirect(`/projekte/${projekt}?panel=aktivitaet`);
}
