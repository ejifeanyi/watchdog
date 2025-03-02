# Watchdog - Stock Tracking & AI Recommendation Platform

<!-- ![Project Banner](https://via.placeholder.com/1200x400) Add a banner image if available -->

Welcome to **watchdog** the **Stock Tracking & AI Recommendation Platform**! This platform provides real-time stock tracking, AI-powered recommendations, and customizable alerts to help you stay on top of the market.

---

## 📖 Documentation

For detailed documentation, including setup instructions, API references, and architecture overview, please visit the **[Documentation](DOCUMENTATION.md)**.

---

## 🚀 Features

- **Real-Time Stock Monitoring**: Get live stock price updates via WebSocket.
- **AI-Powered Recommendations**: Receive personalized stock recommendations powered by Mistral AI.
- **Custom Alerts**: Set price alerts and get notified instantly.
- **High-Performance Architecture**: Built with Redis caching, queue management, and optimized API calls.

---

## 🛠️ Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Redis
- API keys for [Polygon.io](https://polygon.io/) and [Mistral AI](https://mistral.ai/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/stock-tracking-platform.git

   cd stock-tracking-platform
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env` and fill in the required values.

4. Run the database migrations:

   ```bash
   npx prisma migrate dev
   ```

5. Start the server:

   ```bash
   npm start
   ```

### 📂 Project Structure

    ```
    watchdog/

├── backend/ # Backend code
│ ├── src/ # Source code
│ │ ├── routes/ # API routes
│ │ ├── middleware/ # Middleware functions
│ │ ├── services/ # Business logic
│ │ ├── index.js # Entry point
│ │ ├── app.js # Express app setup
│ │ ├── socket.js # WebSocket setup
│ │ └── redis.js # Redis configuration
│ ├── prisma/ # Prisma ORM schema and migrations
│ ├── node_modules/ # Node.js dependencies
│ ├── .env # Environment variables
│ ├── .gitignore # Git ignore file
│ └── package.json # Node.js dependencies
├── frontend/ # Frontend code (Next.js)
│ ├── public/ # Static assets
│ ├── src/ # Source code
│ ├── node_modules/ # Node.js dependencies
│ ├── .env # Environment variables
│ ├── .gitignore # Git ignore file
│ └── package.json # Node.js dependencies
├── DOCUMENTATION.md # Documentation
|\_\_ LICENSE # License
└── README.md # This file
```

### 🔧 Technologies Used

- **Backend:** Node.js, Express, Prisma ORM

- **Real-Time Communication:** Socket.IO

- **Caching & Queues:** Redis, BullMQ

- **AI Integration:** Mistral AI

- **Stock Data:** Polygon.io

- **Database:** PostgreSQL

- **Deployment:** Render (Backend), Vercel (Frontend)

### 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

### 🤝 Contributing

We welcome contributions! Please read the Contributing Guidelines to get started. You can find it at the end of the DOCUMENTATION.md file.

### 📫 Contact

For questions or feedback, feel free to reach out:

- **Email:** [ifeanyiemmanueljoseph@gmail.com](ifeanyiemmanueljoseph@gmail.com)

- **GitHub Issues:** Open an Issue
