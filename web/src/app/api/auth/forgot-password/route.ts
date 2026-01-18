import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { Resend } from "resend"
import crypto from "crypto"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    console.log("Forgot Password API hit") // DEBUG
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { email } = await req.json()
    console.log("Requested email:", email) // DEBUG

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log("User not found") // DEBUG
      // Don't reveal if user exists or not for security
      return NextResponse.json({ success: true })
    }

    // 2. Generate Token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 3600 * 1000) // 1 hour from now

    // 3. Save Token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    // 4. Send Email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    console.log("Sending email to:", email) // DEBUG

    const { data, error } = await resend.emails.send({
      from: "LogStream <onboarding@resend.dev>",
      to: email,
      subject: "Reset your password",
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    })

    if (error) {
      console.error("Resend Error:", error)
      return NextResponse.json({ error: "Email sending failed" }, { status: 500 })
    }

    console.log("Email sent successfully:", data) // DEBUG
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot Password Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
