import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    // 1. Verify Token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    if (new Date() > verificationToken.expires) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 })
    }

    // 2. Hash New Password
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3. Update User Password
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { password: hashedPassword },
    })

    // 4. Delete Token (so it can't be reused)
    await prisma.verificationToken.delete({
      where: { token },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset Password Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
