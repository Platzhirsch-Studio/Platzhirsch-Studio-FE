import { redirect } from "next/navigation";

// Direktaufruf der Schnellanlage (§ 3.3): Liste mit offenem Dialog.
export default function AnfrageNeu() {
  redirect("/crm/anfragen?neu=1");
}
