import { ApiError, handleApi } from "../../../lib/server/data";

export const dynamic = "force-dynamic";

async function proxyLocal(request) {
  const url = new URL(request.url);
  const target = "http://localhost:8080" + url.pathname + url.search;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
  });
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" },
  });
}

async function dispatch(request, context) {
  if (!process.env.BLOB_STORE_ID) return proxyLocal(request);
  try {
    const { path } = await context.params;
    const body = await handleApi(request, path || []);
    return Response.json(body);
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ message: error.message, fields: error.fields || {} }, { status: error.status });
    }
    console.error(error);
    return Response.json({ message: "エラーが発生しました", fields: {} }, { status: 500 });
  }
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const DELETE = dispatch;
