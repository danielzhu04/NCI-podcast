import { cookies } from "next/headers"
import python from '../../../../utils/python.js'

export async function POST(request) {
  const cookieStore = await cookies()
  const authenticated = cookieStore.get("admin_authenticated")

  if (!authenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { id, title, description, tags, image_url } = body
  if (!id) {
    return Response.json({ error: "Missing episode id" }, { status: 400 })
  }

  try {
    const episode = await python("tasks.generatePodcast.updateEpisode", {
      kargs: [],
      kwargs: { episode_id: id, title, description, tags, image_url },
    })
    return Response.json({ success: true, episode })
  } catch (e) {
    console.error(e)
    return Response.json({ error: "Failed to update episode" }, { status: 500 })
  }
}
