# Free Tier Deployment Guide

This guide explains how to deploy LogStream for **$0/month** using "Lite Mode".
In Lite Mode, we skip Kafka/ClickHouse and write logs directly to Postgres (Supabase).

## ☁️ 1. Setup Free Database (Supabase)
1.  Go to [Supabase](https://supabase.com) and create a free project.
2.  Go to **Project Settings > Database** and copy the **Connection String (URI)**.
    *   It looks like: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`
    *   Append `?pgbouncer=true` if using the pooler, or just use direct.

## 🚀 2. Deploy Backend (Render)
1.  Go to [Render.com](https://render.com) and create a **New Web Service**.
2.  Connect your GitHub repository.
3.  **Settings:**
    *   **Runtime:** Docker
    *   **Dockerfile Path:** `./Dockerfile.lite` (Important!)
    *   **Region:** Choose one close to you (e.g., Frankfurt, Oregon).
    *   **Instance Type:** Free.
4.  **Environment Variables:**
    Add the following variable:
    
    | Name | Value |
    |---|---|
    | `DATABASE_URL` | Your Supabase Connection String |
    | `PORT` | `8080` |

5.  Click **Deploy**.
    *   Render will give you a URL like: `https://logstream-backend.onrender.com`

## 🎨 3. Deploy Frontend (Vercel)
1.  Go to [Vercel](https://vercel.com) and import your repo.
2.  **Settings:**
    *   **Root Directory:** `web`
3.  **Environment Variables:**
    
    | Name | Value |
    |---|---|
    | `NEXT_PUBLIC_API_URL` | `https://logstream-backend.onrender.com` |
    | `NEXT_PUBLIC_WS_URL` | `wss://logstream-backend.onrender.com` (Note: wss:// for secure websocket) |
    | `DATABASE_URL` | Your Supabase Connection String (Same as backend) |

4.  Click **Deploy**.

## 🎉 Done!
You now have a globally distributed log platform running for free!

### Limitations of Lite Mode
*   **Throughput:** Postgres is slower than ClickHouse for inserting millions of logs.
*   **Retention:** You will need to manually delete old logs to stay within Supabase free tier limits (500MB).
