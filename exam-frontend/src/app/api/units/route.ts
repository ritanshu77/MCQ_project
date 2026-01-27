import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  
   const backend = process.env.BACKEND_URL ;
  const url = `${backend}/questions/subjects/units?subjectId=${subjectId}`;
    console.log("----errr---",url);
    
  const cookieHeader = request.headers.get("cookie");
  const authHeader = request.headers.get("authorization");

  const res = await fetch(url, {
     headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader || '',
          'Authorization': authHeader || '',
        },
  });
  
  const data = await res.json();
  return NextResponse.json(data);
}
