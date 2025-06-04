import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token } = await req.json();

  const secret = process.env.RECAPTCHA_SECRET!;
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;

  const res = await fetch(verifyUrl, { method: "POST" });
  const data = await res.json();

  return NextResponse.json({ success: data.success && data.score > 0 });
}
