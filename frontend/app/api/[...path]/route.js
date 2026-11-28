export const dynamic = "force-dynamic";
// Render の無料プランは使われていないと停止し、起動に1分近くかかることがあるため待ち時間を延ばす
export const maxDuration = 60;

const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:8080").replace(/\/+$/, "");

// ブラウザからの /api/* はすべてここに届き、Spring Boot へそのまま転送する。
// ブラウザから Spring Boot を直接呼ばないので、CORS の設定やバックエンドの URL を画面に持たせずに済む
async function proxyToBackend(request) {
  const url = new URL(request.url);
  const target = BACKEND_URL + url.pathname + url.search;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);
  let response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
    });
  } catch (error) {
    console.error("Backend unreachable: " + BACKEND_URL, error);
    return Response.json({ message: "サーバーに接続できませんでした。しばらくしてからやり直してください", fields: {} }, { status: 502 });
  }
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" },
  });
}

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PUT = proxyToBackend;
export const DELETE = proxyToBackend;
