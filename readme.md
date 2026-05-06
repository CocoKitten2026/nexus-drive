⬡ Nexus Drive | End-to-End Encrypted Storage

GitHub Description: A lightweight, self-hosted file storage solution featuring client-side AES-GCM encryption, real-time WebSocket syncing, and a modern Discord-inspired UI. Built with Bun and the Web Crypto API.

📖 About Nexus Drive

Nexus Drive is designed for users who want the convenience of cloud storage without sacrificing privacy. Unlike traditional platforms, Nexus uses Zero-Knowledge architecture. Your files are encrypted locally in your browser using a key derived from your password. By the time the data reaches the server, it is nothing but digital noise.

Key Features:

🔒 True E2EE: Encryption happens on the client side. The server never sees your password or your files.

⚡ High Performance: Powered by the Bun runtime for ultra-fast relaying.

🌍 Global Access: Seamless integration with Cloudflare Tunnels for remote access without port forwarding.

✨ Modern UI: Clean, responsive, and intuitive interface for managing your private cloud.

🛠️ Prerequisites (All Systems)

Nexus is built using Bun, a high-performance JavaScript runtime.

Bun Runtime: Required to run the server.js.

Cloudflared: Required to create a secure tunnel (Global Access).

The Files: Ensure you have server.js and index.html in a folder.

🐧 Linux Setup (Ubuntu/Debian/WSL)

1. Install Bun

curl -fsSL [https://bun.sh/install](https://bun.sh/install) | bash
source ~/.bashrc


2. Install Cloudflared

curl -L [https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb](https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb) -o cloudflared.deb
sudo dpkg -i cloudflared.deb


3. Start the Server

bun run server.js


4. Create the Tunnel (High Stability)

Run this command to prevent the tunnel from expiring due to inactivity:

cloudflared tunnel --url http://localhost:3000 --proxy-keepalive-timeout 300s --no-autoupdate


🪟 Windows Setup (PowerShell)

1. Install Bun

Open PowerShell as Administrator and run:

powershell -c "irm bun.sh/install.ps1 | iex"


2. Install Cloudflared

Download the Windows .exe from Cloudflare's GitHub.

Rename the downloaded file to cloudflared.exe and place it in your folder.

3. Run Nexus (High Stability)

Start Server: In one window: bun run server.js

Start Tunnel: In a second window, run this command to ensure a stable connection:

.\cloudflared.exe tunnel --url http://localhost:3000 --proxy-keepalive-timeout 300s --proxy-connection-timeout 300s --proxy-tcp-keepalive 30s --no-autoupdate


🛡️ How to use the Encryption

Server Address: Copy the .trycloudflare.com link from your terminal.

Password: This is your Master Key.

Warning: If you lose this password, your files are gone. There is no "forgot password" for encrypted data.

The server only stores "Digital Noise"—it has no way to help you recover files.

🛑 Stopping the Server

Linux: pkill -f bun

Windows: Press Ctrl+C in the terminal windows.