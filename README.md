# 🚀 1:1 Private Chat (Backend)

The real-time communication core for the private chat application. Powered by Node.js, Express, and Socket.io, handling stateless real-time connections inside RAM.

## 🌐 Live Service

- **Backend WebSocket URL:** `https://webchat-backend-jnhs.onrender.com`

## ✨ Features

- **Stateless Connection:** Messages are transmitted directly via WebSockets without hitting any database—100% ephemeral and secure.
- **Room Capacity Guardian:** Restricts each room to a strict maximum of 2 participants, automatically denying any extra connections.
- **Dynamic System Notices:** Emits real-time event signals (`system_notice`) when a peer joins, leaves, or enters standby mode.
- **CORS Protection:** Configured with server-side environment variables to strictly whitelist and accept traffic only from trusted frontend domains.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Real-time Engine:** Socket.io
- **CORS:** Cors middleware

## 🚀 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
