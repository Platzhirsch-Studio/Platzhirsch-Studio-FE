import { redirect } from "next/navigation";

export default function NotFound() {
    redirect("/de/404");
}