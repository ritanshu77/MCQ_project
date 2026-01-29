import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const titleId = searchParams.get("titleId");
  const chapterId = searchParams.get("chapterId");
  const examId = searchParams.get("examId");
  const quizType = searchParams.get("quizType");

  const backend = process.env.BACKEND_URL || "http://localhost:3001";
  const url = `${backend}/questions/sets` +
    `?${titleId ? `titleId=${titleId}&` : ''}` +
    `${chapterId ? `chapterId=${chapterId}&` : ''}` +
    `${examId ? `examId=${examId}&` : ''}` +
    `${quizType ? `quizType=${quizType}` : ''}`;

  try {
    const cookieHeader = request.headers.get("cookie");
    const authHeader = request.headers.get("authorization");

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader || "",
        "Authorization": authHeader || "",
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching sets:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
