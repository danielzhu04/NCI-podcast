import { cookies } from "next/headers"

const MAX_BYTES = 50 * 1024 * 1024

export async function GET(request) {
  const cookieStore = await cookies()
  const authenticated = cookieStore.get("admin_authenticated")

  if (!authenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rawUrl = new URL(request.url).searchParams.get("url")
  if (!rawUrl) {
    return Response.json({ error: "Missing url" }, { status: 400 })
  }

  let target
  try {
    target = new URL(rawUrl)
  } catch {
    return Response.json({ error: "Invalid url" }, { status: 400 })
  }

  if (target.protocol !== "https:") {
    return Response.json({ error: "Only https PDF urls are allowed" }, { status: 400 })
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { Accept: "application/pdf,*/*" },
      redirect: "follow",
    })
    if (!upstream.ok) {
      return Response.json({ error: "Could not download open-access PDF" }, { status: 502 })
    }

    const buffer = Buffer.from(await upstream.arrayBuffer())
    if (buffer.length > MAX_BYTES) {
      return Response.json({ error: "PDF is too large" }, { status: 413 })
    }

    const filename = target.pathname.split("/").filter(Boolean).pop() || "paper.pdf"
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename.endsWith(".pdf") ? filename : "paper.pdf"}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error(e)
    return Response.json({ error: "Failed to fetch PDF" }, { status: 502 })
  }
}
