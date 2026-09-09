import { queue_generate_podcast } from '@/tasks/generatePodcast.js'
import { ZodError } from 'zod'
import { cookies } from "next/headers"

export async function POST(request) {
  const cookieStore = await cookies()
  const authenticated = cookieStore.get("admin_authenticated")

  if (!authenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const pdfFile = formData.get('pdf')
  if (!pdfFile) {
    return Response.json({ error: 'No PDF file provided' }, { status: 400 })
  }

  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf_base64 = Buffer.from(arrayBuffer).toString('base64')

  const body = {
    pdf_base64,
    publication_url: formData.get('publication_url'),
    tool_url: formData.get('tool_url'),
    image_url: formData.get('image_url'),
  }

  try {
    const job_id = await queue_generate_podcast(body)
    return Response.json({ job_id }, { status: 202 })
  } catch (e) {
    if (e instanceof ZodError) {
      return Response.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return Response.json({ error: 'Failed to queue podcast job' }, { status: 500 })
  }
}