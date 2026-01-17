# Deployment Guide

This guide explains how to deploy the **Backend (LogStream)** to a VPS/Cloud (like AWS/DigitalOcean) and the **Frontend** to Vercel.

## 🌍 1. Backend Deployment (VPS)

Since LogStream uses Kafka and ClickHouse, it requires a server with at least **4GB RAM**. A standard $20/mo VPS (e.g., DigitalOcean Droplet, AWS EC2 t3.medium) works well.

### A. Prepare the Server
1.  **SSH into your server:**
    ```bash
    ssh user@your-server-ip
    ```
2.  **Install Docker & Docker Compose:**
    ```bash
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    
    # Install Compose
    sudo apt install docker-compose-plugin
    ```

### B. Deploy Services
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/davidojo1144/LogStream.git
    cd LogStream
    ```
2.  **Start Production Containers:**
    Use the production compose file which builds the Go binaries inside Docker containers.
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

### C. Verify Deployment
Check if services are running:
```bash
docker compose -f docker-compose.prod.yml ps
```
Your backend is now live!
*   **Collector:** `http://your-server-ip:8080`
*   **API:** `http://your-server-ip:8081`

---

## ⚡ 2. Frontend Deployment (Vercel)

1.  **Push your code to GitHub.**
2.  **Go to [Vercel](https://vercel.com)** and import your repository.
3.  **Configure Project:**
    *   **Root Directory:** `web` (Important! Select the `web` folder).
    *   **Framework Preset:** Next.js.
4.  **Environment Variables:**
    Add the following variables so the frontend knows where your backend is:

    | Name | Value |
    |Str|Str|
    | `NEXT_PUBLIC_API_URL` | `http://your-server-ip:8081` |
    | `NEXT_PUBLIC_WS_URL` | `ws://your-server-ip:8081` |

5.  **Deploy!** 🚀

---

## 🔒 Security Note (Production)
For a real production environment, you should:
1.  **Use HTTPS:** Set up Nginx with SSL (Let's Encrypt) in front of the API and Collector.
2.  **Firewall:** Only open ports 80/443 (Nginx) and close 8080/8081/9092/8123 to the public.
3.  **Database Passwords:** Change the default passwords in `docker-compose.prod.yml`.
