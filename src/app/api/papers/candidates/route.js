import { cookies } from "next/headers"
import python from '../../../../utils/python.js'

export async function GET(request) {
  const cookieStore = await cookies()
  const authenticated = cookieStore.get("admin_authenticated")

  if (!authenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const window = searchParams.get("window") || "90d"
  const limit = Number(searchParams.get("limit") || 10)

  try {
    const result = await python("tasks.paperFinder.find_candidates", {
      kargs: [],
      kwargs: { window, limit },
    })
    return Response.json(result)
  } catch (e) {
    console.error(e)
    return Response.json({ error: "Failed to find paper candidates" }, { status: 500 })
  }
}
