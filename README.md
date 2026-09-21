# AI Chat Assistant (MERN Stack)

A full-stack AI Chat Assistant built with MongoDB, Express, React (Vite), and Node.js — powered by the **Mistral AI API** with real-time streaming responses via Server-Sent Events.

## Features

- 🤖 **Real-time AI streaming** via Server-Sent Events (SSE) — progressive response rendering
- 💬 **Conversation history** stored in MongoDB with sidebar navigation
- 🎭 **Tone selector** — Professional, Casual, Concise
- 🗑️ **Delete conversations** from sidebar
- 📱 **Responsive design** — desktop and mobile
- ⚡ **Auto-scroll**, typing indicators, loading states
- 🔒 **Secure** — OpenAI API key never exposed to client

## Tech Stack

| Layer    | Technology               |
|----------|--------------------------|
| Frontend | React 18 + Vite          |
| Backend  | Node.js + Express.js     |
| Database | MongoDB + Mongoose       |
| AI       | Mistral AI API (`mistral-small-latest`) |
| Streaming| Server-Sent Events (SSE) |

## Project Structure

```
ai-chat-assistant/
├── server/
│   ├── controllers/
│   │   ├── chatController.js        # SSE streaming logic
│   │   └── conversationController.js
│   ├── models/
│   │   └── Conversation.js          # Mongoose schema
│   ├── routes/
│   │   ├── chat.js
│   │   └── conversations.js
│   ├── services/
│   │   └── openaiService.js         # OpenAI streaming
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── ChatWindow.jsx
    │   │   ├── MessageBubble.jsx
    │   │   ├── ChatInput.jsx
    │   │   └── ToneSelector.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Setup & Running

### 1. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```
MISTRAL_API_KEY=your-key-here
MONGODB_URI=mongodb://localhost:27017/ai-chat-assistant
PORT=5000
```

### 2. Install Dependencies

```bash
# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 3. Run Development Servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## API Endpoints

| Method | Endpoint                   | Description                    |
|--------|----------------------------|--------------------------------|
| `GET`  | `/api/conversations`       | List all conversations         |
| `GET`  | `/api/conversations/:id`   | Get conversation with messages |
| `POST` | `/api/conversations`       | Create a conversation          |
| `DELETE` | `/api/conversations/:id` | Delete a conversation          |
| `POST` | `/api/chat/stream`         | Stream AI response (SSE)       |
| `GET`  | `/health`                  | Server health check            |

### Chat Stream Request Body

```json
{
  "conversationId": "optional-existing-id",
  "message": "Your message here",
  "tone": "professional | casual | concise"
}
```

## Environment Variables

| Variable        | Required | Description                      |
|-----------------|----------|----------------------------------|
| `MISTRAL_API_KEY`| ✅        | Your Mistral API key             |
| `MONGODB_URI`   | ✅        | MongoDB connection string        |
| `PORT`          | ❌        | Server port (default: 5000)      |
| `CLIENT_URL`    | ❌        | Frontend URL for CORS (default: http://localhost:5173) |
