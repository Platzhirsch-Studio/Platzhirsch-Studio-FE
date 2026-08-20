// lib/revalidate.js
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function handleRevalidate(request, paths = []) {
    try {
        const done = [];
        for (const entry of paths) {
            if (Array.isArray(entry)) {
                revalidatePath(entry[0], entry[1]);
                done.push(`${entry[0]} (${entry[1]})`);
            } else {
                revalidatePath(entry);
                done.push(entry);
            }
        }
        return NextResponse.json({ revalidated: true, paths: done, now: Date.now() });
    } catch (err) {
        console.error("Revalidation failed:", err);
        return NextResponse.json(
            { revalidated: false, message: String(err?.message || err) },
            { status: 500 }
        );
    }
}