import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const backend = process.env.BACKEND_URL || "http://localhost:3001";
  const url = `${backend}/questions/subjects/units`;
    
  const cookieHeader = request.headers.get("cookie");
  const authHeader = request.headers.get("authorization");

  const res = await fetch(url, {
     method: 'POST',
     headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader || '',
          'Authorization': authHeader || '',
        },
      body: JSON.stringify(body),
      cache: 'no-store'
  });
  
  const data = await res.json();
  return NextResponse.json(data);
}
