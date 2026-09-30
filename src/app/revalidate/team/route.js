// app/revalidate-career/route.js
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {

    // Revalidate everything with 'career' tag
    revalidateTag('team');

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: "Team pages revalidated successfully using tag"
    });
  } catch (err) {
    console.error("❌ Revalidation failed:", err);
    return NextResponse.json(
      { revalidated: false, message: String(err) },
      { status: 500 }
    );
  }
}