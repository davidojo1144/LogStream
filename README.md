# 🌊 LogStream

![LogStream Banner](https://placehold.co/1200x400/1e1e1e/FFF?text=LogStream+Dashboard&font=montserrat)

**LogStream** is a lightweight, real-time distributed log aggregation platform designed for developers who need instant visibility into their applications.

Built with **Go (Golang)** for high-performance ingestion and **Next.js** for a reactive, real-time dashboard.

---

## 🚀 Features

-   **⚡ Real-time Streaming:** Watch logs arrive instantly via WebSockets.
-   **🔍 Powerful Filtering:** Filter by service, log level (INFO, ERROR, WARN), or search keywords.
-   **🛡️ Secure:** API Key authentication for log ingestion.
-   **📊 Visual Insights:** Interactive charts showing log volume and error rates over time.
-   **☁️ Free to Deploy:** Runs perfectly on the free tiers of Vercel (Frontend), Render (Backend), and Supabase (Database).

---

## 🛠️ Tech Stack

-   **Backend:** Go (Golang), Gorilla WebSockets
-   **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Shadcn UI
-   **Database:** PostgreSQL (Supabase)
-   **Deployment:** Docker, Render, Vercel

---

## 🏁 Getting Started

### 1. Deploy Your Own
Follow our **[Free Deployment Guide](DEPLOY_FREE.md)** to set up your own instance in under 10 minutes for $0.

### 2. Local Development

**Prerequisites:**
-   Go 1.21+
-   Node.js 18+
-   Docker (optional, for local DB)

**Backend:**
```bash
# Clone the repo
git clone https://github.com/davidojo1144/LogStream.git
cd LogStream

# Run the Lite Server (Ingestor + API)
go run lite/*.go
```

**Frontend:**
```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:3000` to see the dashboard!

---

## 📚 Documentation

-   **[User Guide & API Reference](USER_GUIDE.md)** - How to send logs from your apps.
-   **[Deployment Guide](DEPLOY_FREE.md)** - Host it for free.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
