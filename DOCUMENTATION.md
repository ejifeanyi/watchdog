# Watchdog

Stock Tracking & AI Recommendation Platform

## Technical Documentation

## Table of Contents

- [Watchdog](#watchdog)
	- [Technical Documentation](#technical-documentation)
	- [Table of Contents](#table-of-contents)
	- [System Overview](#system-overview)
	- [Backend Architecture](#backend-architecture)
		- [Core Components](#core-components)
		- [Service-Based Architecture](#service-based-architecture)
		- [Data Flow](#data-flow)
	- [Performance Optimization Systems](#performance-optimization-systems)
		- [Redis Caching Implementation](#redis-caching-implementation)
	- [Key Caching Strategies:](#key-caching-strategies)
	- [Queue Management System](#queue-management-system)
	- [Rate Limiting Strategy](#rate-limiting-strategy)
	- [Real-Time Communication Layer](#real-time-communication-layer)
		- [WebSocket Implementation](#websocket-implementation)
		- [Price Polling \& Batching Strategy](#price-polling--batching-strategy)
	- [Alert Distribution System](#alert-distribution-system)
	- [External API Integration](#external-api-integration)
		- [Polygon.io Service](#polygonio-service)
	- [Mistral AI Integration](#mistral-ai-integration)
	- [Database Layer](#database-layer)
		- [Schema Design](#schema-design)
	- [Prisma ORM Implementation](#prisma-orm-implementation)
	- [Authentication \& Security](#authentication--security)
		- [JWT Implementation](#jwt-implementation)
		- [Security Best Practices](#security-best-practices)
	- [Installation \& Configuration](#installation--configuration)
		- [Environment Setup](#environment-setup)
	- [Dependencies](#dependencies)
		- [Configuration Files](#configuration-files)
	- [Deployment Pipeline](#deployment-pipeline)
		- [Backend Deployment (Render)](#backend-deployment-render)
		- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
	- [API Reference](#api-reference)
		- [Stock \& Watchlist Routes](#stock--watchlist-routes)
		- [Alert Management Routes](#alert-management-routes)
		- [AI Recommendation Routes](#ai-recommendation-routes)
	- [Performance Monitoring](#performance-monitoring)
	- [Contributing Guidelines](#contributing-guidelines)

## System Overview

This platform provides a comprehensive stock tracking and AI-powered recommendation system with several distinctive features:

- **Real-time stock monitoring** with WebSocket-based price updates
- **AI-powered stock recommendations** generated using Mistral AI
- **Alert systems** that notify users when stocks reach target prices
- **High-performance architecture** using Redis caching, queue-based processing, and optimized API calls

The system employs a modern, microservices-inspired architecture with distinct components handling specific responsibilities, allowing for scalability, maintainability, and high performance.

## Backend Architecture

### Core Components

The backend architecture is built on Node.js and Express, with several critical infrastructure components:

1. **Express Application Server**: Handles HTTP requests and API endpoints
2. **Socket.IO Server**: Manages real-time WebSocket connections
3. **Redis Instance**: Provides caching and queue management
4. **Prisma ORM**: Abstracts database operations
5. **Polygon.io Integration**: Fetches external stock data
6. **Mistral AI Integration**: Generates AI-based stock recommendations

### Service-Based Architecture

The backend follows a modular, service-based approach where different components handle specific responsibilities:

```plaintext
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ 					│ │ 				  │ │ 					│
│ API Controllers 	│───▶ Service Layer  ────▶ Data Access     │
│ 					│ │ 				  │ │ Layer (Prisma) 	│
└───────────────────┘ └───────────────────┘ └───────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 																 │
│ 			Integration Services (External APIs) 				 │
│ 																 │
└────────────────────────────────────────────────────────────────┘
                                │
                       ┌────────┴────────┐
                       ▼                 ▼
             ┌─────────────────┐ ┌─────────────────┐
             │                 │ │                 │
             │   Redis Cache   │ │   Redis Queue   │
             │                 │ │                 │
             └─────────────────┘ └─────────────────┘
```

### Data Flow

1. **Request Handling**: API controllers receive requests and delegate to appropriate services
2. **Service Processing**: Business logic is processed in the service layer
3. **Data Access**: Prisma ORM executes database operations
4. **External API Integration**: Services make external API calls when needed
5. **Caching**: Redis caches frequently accessed data and API responses
6. **Queuing**: Heavy operations are processed through BullMQ queues
7. **Real-time Updates**: Socket.IO delivers updates to connected clients

## Performance Optimization Systems

### Redis Caching Implementation

The platform uses Redis as a centralized caching layer to dramatically improve performance and reduce external API calls. The Redis client is configured as follows:

```javascript
import { createClient } from "redis";

const redis = createClient({
	username: "default",
	password: "m3sWr8Ir4BmlTf5GhfsbSr5k5xbyvBN7",
	socket: {
		host: "redis-18072.c62.us-east-1-4.ec2.redns.redis-cloud.com",
		port: 18072,
	},
});

redis.on("error", (err) => console.log("Redis Client Error", err));

await redis.connect();

export default redis;
```

## Key Caching Strategies:

1. **AI Recommendations:** Cached for 24 hours to minimize expensive AI API calls

```javascript
// Example recommendation caching
await redis.set(`ai:recommendations:${userId}`, JSON.stringify(aiResponse), {
	ex: 86400,
});
```

2. **Stock Price Data:** Cached with dynamic TTLs based on market hours

```javascript
// From the getStockPrice function
await redis.set(`stock:${symbol}`, price.toString(), { ex: 3600 });
```

3. **External API Responses:** Cached with endpoint-specific durations

```javascript
// From the Polygon service
const cacheKey = `polygon:${url.replace(/[^a-zA-Z0-9]/g, "_")}`;
await redis.set(cacheKey, JSON.stringify(response.data), { ex: cacheTime });
```

4. **User Data:** Frequently accessed user data cached for fast retrieval

```javascript
// Example user watchlist caching
await redis.set(`watchlist:${userId}`, JSON.stringify(watchlist), { ex: 300 });
```

## Queue Management System

The platform implements a sophisticated queue system for managing API requests to external services, particularly the Polygon.io stock data API. The system:

1. **Prioritizes Critical Requests:** Higher-priority requests (like price data) get processed first

2. **Manages Rate Limits:** Prevents exceeding API rate limits through intelligent throttling

3. **Persists Queue State:** Stores queue state in Redis to survive server restarts

4. **Handles Retries:** Automatically retries failed requests with exponential backoff

Key implementation details:

```javascript
// Queue processing logic from polygonService.js
async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
        return;
    }

    this.isProcessingQueue = true;

    try {
        // Check rate limits
        const counter = await redis.get(COUNTER_KEY);
        const requestsMade = counter ? parseInt(counter, 10) : 0;

        if (requestsMade >= MAX_REQUESTS_PER_MINUTE) {
            console.log(`⏳ Rate limit reached (${requestsMade}/${MAX_REQUESTS_PER_MINUTE}). Waiting...`);
            this.isProcessingQueue = false;
            return;
        }

        // Get highest priority request
        const request = this.requestQueue.shift();
        // Process request...
    } finally {
        this.isProcessingQueue = false;

        // Continue processing queue with delay
        if (this.requestQueue.length > 0) {
            setTimeout(() => this.processQueue(), 5000);
        }
    }
}
```

## Rate Limiting Strategy

The application implements several layers of rate limiting:

1. **Internal API Rate Limiting:** Using Express-Rate-Limit to prevent abuse

```javascript
// Example API rate limiting setup
app.use(
	"/api/recommendations",
	rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 5, // 5 requests per window
		message: "Too many recommendation requests, please try again later",
	})
);
```

2. **External API Rate Limiting:** The Polygon service implements a token bucket-style limiter

```javascript
const MAX_REQUESTS_PER_MINUTE = 5;
const COUNTER_KEY = "polygon_api_counter";
const COUNTER_RESET_SECONDS = 60; // 1 minute

// Increment counter with expiration
await redis.incr(COUNTER_KEY);
await redis.expire(COUNTER_KEY, COUNTER_RESET_SECONDS);
```

3. **Prioritization:** Critical operations get priority access to limited resources

```javascript
// Different priorities for different operations
async getPreviousDayData(ticker) {
    return this.request(`/v2/aggs/ticker/${ticker}/prev`, undefined, 5); // High priority
}

async getNews(ticker) {
    return this.request(`/v2/reference/news?ticker=${ticker}`, undefined, 1); // Lower priority
}
```

## Real-Time Communication Layer

### WebSocket Implementation

The platform uses Socket.IO for real-time updates to connected clients. The implementation:

- **Initializes Socket.IO** with the Express server

- **Manages Client Connections** through connection events

- **Creates Client Rooms** for targeted alerts and updates

- **Distributes Stock Updates** to relevant subscribers

- **Delivers Price Alerts** through room-based targeting

```javascript
// WebSocket initialization
function initWebSockets(server) {
	console.log("🔌 Initializing WebSockets...");

	try {
		const io = new Server(server, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
			},
			transports: ["websocket", "polling"],
		});

		console.log("🟢 Socket.IO server instance created successfully.");

		io.on("connection", (socket) => {
			connectedClients.add(socket.id);
			console.log(`✅ Socket connected: ${socket.id}`);

			socket.emit("connectionConfirmed", { socketId: socket.id });

			socket.on("subscribeAlerts", (userId) => {
				const roomName = `user-${userId}`;
				socket.join(roomName);
				console.log(`User ${userId} subscribed to alerts. Room: ${roomName}`);
				socket.emit("subscriptionConfirmed", { userId, status: "subscribed" });
			});

			socket.on("disconnect", (reason) => {
				connectedClients.delete(socket.id);
				console.log(`❌ Socket ${socket.id} disconnected due to ${reason}`);
			});
		});

		// Start the price polling system
		setInterval(updateMonitoredSymbols, 300000);
		const pollingInterval = setInterval(
			() => fetchBatchedStockPrices(io),
			POLLING_INTERVAL
		);

		// Initial symbol load
		updateMonitoredSymbols();

		return io;
	} catch (error) {
		console.error("Failed to initialize WebSockets:", error);
		throw error;
	}
}
```

### Price Polling & Batching Strategy

To optimize external API usage while keeping data fresh, the system:

1. **Tracks Monitored Symbols:** Maintains a set of symbols requiring updates

2. **Batches API Requests:** Groups symbols into batches of 5 (Polygon API limit)

3. **Processes Batches Incrementally:** Rotates through batches on each polling cycle

4. **Stores Batch State in Redis:** Remembers which batch to process next

5. **Distributes Updates via WebSockets:** Pushes price updates to clients

```javascript
async function fetchBatchedStockPrices(io) {
	if (monitoredSymbols.size === 0) {
		console.log("No stocks to monitor, skipping price updates");
		return;
	}

	console.log(`Fetching prices for ${monitoredSymbols.size} symbols`);

	// Group symbols into batches of max 5 (Polygon's limits for multiple tickers)
	const symbolsArray = Array.from(monitoredSymbols);
	const batches = [];

	for (let i = 0; i < symbolsArray.length; i += 5) {
		batches.push(symbolsArray.slice(i, i + 5));
	}

	console.log(`Split into ${batches.length} batches`);

	// Process one batch per polling interval to stay within rate limits
	const batchKey = "current_symbol_batch";
	const currentBatchIndex = parseInt((await redis.get(batchKey)) || "0");
	const nextBatchIndex = (currentBatchIndex + 1) % batches.length;

	// Store the next batch index for the next run
	await redis.set(batchKey, nextBatchIndex.toString());

	// Get the current batch to process
	const currentBatch = batches[currentBatchIndex];

	if (!currentBatch || currentBatch.length === 0) {
		return;
	}

	console.log(
		`Processing batch ${currentBatchIndex + 1}/${
			batches.length
		}: ${currentBatch.join(", ")}`
	);

	// Process each symbol in the batch
	for (const symbol of currentBatch) {
		try {
			const price = await getStockPrice(symbol);

			if (price !== null) {
				io.emit("priceUpdate", { symbol, price });
				await checkPriceAlerts(io, symbol, price);
			}
		} catch (error) {
			console.error(`Error updating price for ${symbol}:`, error);
		}
	}
}
```

## Alert Distribution System

The platform implements a real-time alert system that:

- **Checks Current Prices** against user-defined target prices

- **Identifies Triggered Alerts** when prices exceed targets

- **Emits Alert Notifications** to specific user rooms

- **Updates Alert Status** in the database

```javascript
async function checkPriceAlerts(io, symbol, currentPrice) {
	try {
		const alerts = await prisma.alert.findMany({
			where: { symbol, isTriggered: false },
		});

		for (const alert of alerts) {
			if (currentPrice >= alert.targetPrice) {
				console.log(`🚨 Alert Triggered: ${symbol} hit $${alert.targetPrice}!`);

				const userRoom = `user-${alert.userId}`;
				const roomSize = io.sockets.adapter.rooms.get(userRoom)?.size || 0;

				if (roomSize > 0) {
					io.to(userRoom).emit("alert", {
						symbol,
						price: currentPrice,
						message: `🔔 ${symbol} has hit $${alert.targetPrice}!`,
						alertId: alert.id,
					});
				}

				await prisma.alert.update({
					where: { id: alert.id },
					data: { isTriggered: true },
				});
			}
		}
	} catch (error) {
		console.error("Error in checkPriceAlerts:", error);
	}
}
```

## External API Integration

### Polygon.io Service

The Polygon.io service is a sophisticated wrapper around the Polygon stock data API that:

1. **Manages API Rate Limits:** Implements a token bucket algorithm

2. **Queues and Prioritizes Requests:** Processes higher-priority requests first

3. **Implements Intelligent Caching:** Caches responses with endpoint-specific TTLs

4. **Handles Request Failures:** Retries failed requests with backoff

5. **Persists Queue State:** Stores the request queue in Redis

Key methods include:

```javascript
/**
 * Make a request to the Polygon API with rate limiting
 * @param url API endpoint without base URL and API key
 * @param config Axios request config
 * @param priority Higher number = higher priority (default: 1)
 * @returns Promise with API response
 */
async request(url, config, priority = 1) {
    // First check cache
    const cacheKey = `polygon:${url.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
        console.log(`🔵 Cache hit for: ${url}`);
        return JSON.parse(cachedData);
    }

    // Not in cache, queue the request
    return new Promise((resolve, reject) => {
        this.requestQueue.push({
            url,
            config,
            resolve,
            reject,
            priority,
        });

        this.sortQueue();
        this.saveQueueToRedis();

        if (!this.isProcessingQueue) {
            this.processQueue();
        }
    });
}

// Helper methods for common API operations
async getPreviousDayData(ticker) {
    return this.request(
        `/v2/aggs/ticker/${ticker}/prev`,
        undefined,
        5 // High priority for price data
    );
}

async searchTickers(query) {
    return this.request(
        `/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true`,
        undefined,
        3 // Medium priority
    );
}
```

## Mistral AI Integration

The platform integrates with Mistral AI to provide AI-powered stock recommendations:

1. **Processes User Watchlists:** Analyzes user's existing stock selections

2. **Formulates AI Prompts:** Creates context-aware prompts for the AI model

3. **Caches AI Responses:** Reduces API costs through intelligent caching

4. **Formats Recommendations:** Renders AI outputs in user-friendly formats

## Database Layer

### Schema Design

The database schema includes the following primary entities:

1. **Users:** Account information and authentication details

2. **Watchlists:** User-specific collections of tracked stocks

3. **Alerts:** Price targets and notification settings

4. **AIRecommendations:** Cached AI recommendations and metadata

## Prisma ORM Implementation

The application uses Prisma ORM for type-safe database operations:

```
// Example Prisma schema (schema.prisma)
model User {
  id             Int        @id @default(autoincrement())
  email          String     @unique
  name           String?
  password       String
  watchlist      Watchlist[]
  alerts         Alert[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}

model Watchlist {
  id             Int        @id @default(autoincrement())
  userId         Int
  symbol         String
  addedAt        DateTime   @default(now())
  user           User       @relation(fields: [userId], references: [id])

  @@unique([userId, symbol])
}

model Alert {
  id             Int        @id @default(autoincrement())
  userId         Int
  symbol         String
  targetPrice    Float
  isTriggered    Boolean    @default(false)
  createdAt      DateTime   @default(now())
  user           User       @relation(fields: [userId], references: [id])
}
```

Database operations are performed using the Prisma client:

```javascript
// Example Prisma client operations
const prisma = new PrismaClient();

// Creating a new alert
const newAlert = await prisma.alert.create({
	data: {
		userId: req.user.id,
		symbol: req.body.symbol,
		targetPrice: parseFloat(req.body.targetPrice),
	},
});

// Getting a user's watchlist
const watchlist = await prisma.watchlist.findMany({
	where: { userId: req.user.id },
	orderBy: { addedAt: "desc" },
});
```

## Authentication & Security

### JWT Implementation

The platform uses JSON Web Tokens (JWT) for authentication:

1. **Token Generation:** Creates signed JWTs during login/signup

2. **Token Verification:** Verifies token validity on protected routes

3. **Payload Security:** Includes minimal user data in token payloads

4. **Expiration Handling:** Implements token expiration and refresh mechanisms

### Security Best Practices

The platform implements several security best practices:

1. **Password Hashing:** Uses bcrypt for secure password storage

2. **CORS Protection:** Implements proper CORS policies

3. **Rate Limiting:** Prevents brute-force attacks

4. **Environment Variables:** Secures sensitive configuration

5. **Input Validation:** Validates and sanitizes all user inputs

## Installation & Configuration

### Environment Setup

Required environment variables:

```
# API Keys
MISTRAL_API_KEY=your_mistral_api_key
POLYGON_API_KEY=your_polygon_api_key

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h

# Database
DATABASE_URL=your_postgresql_connection_string

# Redis
REDIS_URL=your_redis_connection_string
REDIS_USERNAME=default
REDIS_PASSWORD=your_redis_password
REDIS_HOST=redis-host.example.com
REDIS_PORT=18072

# Server Configuration
PORT=8080
NODE_ENV=production
```

## Dependencies

Core dependencies include:

- **Express.js:** Web server framework

- **Socket.IO:** WebSocket implementation

- **Prisma:** ORM for database operations

- **Redis:** Caching and queue management

- **BullMQ:** Queue processing system

- **Axios:** HTTP client for API requests

- **JSON Web Token:** Authentication tokens

### Configuration Files

Key configuration files:

1. **package.json:** Dependencies and scripts

2. **.env:** Environment variables

3. **prisma/schema.prisma:** Database schema

4. **redis.js:** Redis connection configuration

## Deployment Pipeline

### Backend Deployment (Render)

Steps for deploying to Render:

- **Create a Web Service** on Render dashboard

- **Connect GitHub Repository** to Render

- **Configure Build Command:** `npm install && npx prisma generate`

- **Configure Start Command:** `npm start`

- **Add Environment Variables** from `.env` file

- **Deploy Application** and monitor logs

### Frontend Deployment (Vercel)

Steps for deploying the frontend to Vercel:

- **Install Vercel CLI:** `npm install -g vercel`

- **Login to Vercel:** `vercel login`

- **Deploy Frontend:** `vercel --prod`

- **Configure Environment Variables** in Vercel dashboard

- **Set Backend API URL** in environment variables

## API Reference

Authentication Routes

**Signup**

- **Endpoint:** POST /auth/signup

Body:

```json
{
	"name": "John Doe",
	"email": "john@example.com",
	"password": "securepassword"
}
```

**Response:**

```json
{
	"token": "jwt_token",
	"user": {
		"id": 1,
		"name": "John Doe",
		"email": "john@example.com"
	}
}
```

- **Login**

**Endpoint:** POST /auth/login

Body:

```json
{
	"email": "john@example.com",
	"password": "securepassword"
}
```

**Response**

```json
{
	"token": "jwt_token",
	"user": {
		"id": 1,
		"name": "John Doe",
		"email": "john@example.com"
	}
}
```

### Stock & Watchlist Routes

- **Add to Watchlist**

**Endpoint:** POST /watchlist/add

Body:

```json
{
	"symbol": "AAPL"
}
```

- **Get Watchlist**

**Endpoint:** GET /watchlist

- **Remove from Watchlist**

**Endpoint:** DELETE /watchlist/:symbol

### Alert Management Routes

- **Add Alert**

**Endpoint:** POST /alerts/add

Body:

```json
{
	"symbol": "AAPL",
	"targetPrice": 150
}
```

- **Get Alerts**

**Endpoint:** GET /alerts

- **Delete Alert**

**Endpoint:** DELETE /alerts/:id

### AI Recommendation Routes

- **Get Stock Recommendations**

**Endpoint:** POST /recommend

Body:

```json
{
	"watchlist": ["AAPL", "TSLA"]
}
```

**Response**

```json
{
	"fullResponse": "AI-generated stock recommendations...",
	"timestamp": "2024-03-02T10:00:00Z"
}
```

## Performance Monitoring

The platform implements logging and monitoring to track:

1. **API Response Times:** Tracks endpoint performance

2. **Cache Hit Rates:** Monitors caching effectiveness

3. **Queue Length:** Tracks API request backlog

4. **Error Rates:** Monitors system stability

5. **WebSocket Connections:** Tracks active clients

## Contributing Guidelines

1. **Fork the Repository:** Create your own fork

2. **Create Feature Branch:** `git checkout -b feature/your-feature`

3. **Follow Coding Standards:** ESLint and Prettier configuration

4. **Write Unit Tests:** Jest for testing components

5. **Submit Pull Request:** Detailed description of changes
