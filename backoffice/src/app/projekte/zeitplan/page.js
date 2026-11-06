import { redirect } from "next/navigation";

/** E15: Zeitplan ist eine Ansicht der Projektliste (307). */
export default function Zeitplan() {
  redirect("/projekte/liste?ansicht=zeitplan");
}
