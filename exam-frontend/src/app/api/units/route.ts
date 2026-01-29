import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  const titleId = searchParams.get('titleId');
  const backend = process.env.BACKEND_URL || "http://localhost:3001";
  const url = `${backend}/questions/subjects/units?subjectId=${subjectId}${titleId ? `&titleId=${titleId}` : ''}`;
    
  const cookieHeader = request.headers.get("cookie");
  const authHeader = request.headers.get("authorization");

  const res = await fetch(url, {
     headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader || '',
          'Authorization': authHeader || '',
        },
      cache: 'no-store'
  });
  
  const data = await res.json();
  return NextResponse.json(data);
}
