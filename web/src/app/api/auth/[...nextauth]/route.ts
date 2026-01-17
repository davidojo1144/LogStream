import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Mock authentication for demonstration
        if (credentials?.username === "admin" && credentials?.password === "password") {
          return { id: "1", name: "Admin User", email: "admin@example.com" }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  theme: {
    colorScheme: "dark",
  },
  secret: "secret-key-for-demo-purposes-only", // In production, use env var
})

export { handler as GET, handler as POST }
