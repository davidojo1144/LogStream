import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

// Helper to generate a secure random key
function generateApiKey() {
  return `pk_${randomBytes(16).toString("hex")}`
}

export async function GET() {
  const session = await getServerSession()
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { apiKeys: { orderBy: { createdAt: "desc" } } },
  })

  return NextResponse.json(user?.apiKeys || [])
}

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name } = await req.json()
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const newKey = await prisma.apiKey.create({
    data: {
      name,
      key: generateApiKey(),
      userId: user.id,
    },
  })

  return NextResponse.json(newKey)
}

export async function DELETE(req: Request) {
  const session = await getServerSession()
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }

  // Verify ownership before deleting
  const key = await prisma.apiKey.findUnique({ where: { id } })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })

  if (!key || !user || key.userId !== user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 })
  }

  await prisma.apiKey.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
