import { redirect } from "next/navigation";

// Alte Route (Konzept § 3.1, E10): Zeiten, Abwesenheiten und Mitarbeiter sind Reiter der Seite Team.
export default function Umleitung() {
  redirect("/personal/team?ansicht=personen");
}
