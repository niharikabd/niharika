import { revalidatePath } from "next/cache";

// pipeline প্রকাশের পর এটি ডাকে, যাতে সাইটে নতুন খবর সঙ্গে সঙ্গে দেখা যায়
export async function POST(req: Request) {
  if (!process.env.REVALIDATE_SECRET || req.headers.get("x-revalidate-secret") !== process.env.REVALIDATE_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
