"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
	useRef,
	useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { Bell, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

// Define types for our context
interface AlertNotification {
	symbol: string;
	price: number;
	message: string;
	alertId: string;
}

interface WebSocketContextType {
	isConnected: boolean;
	priceUpdates: Record<string, number>;
	notifications: AlertNotification[];
	dismissNotification: (alertId: string) => void;
	connectionStatus: "connected" | "disconnected" | "connecting" | "error";
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// URL should match your backend server
const SOCKET_URL =
	process.env.NEXT_PUBLIC_SOCKET_URL || "https://watchdog-c8e1.onrender.com";

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
	const [isConnected, setIsConnected] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<
		"connected" | "disconnected" | "connecting" | "error"
	>("disconnected");
	const [priceUpdates, setPriceUpdates] = useState<Record<string, number>>({});
	const [notifications, setNotifications] = useState<AlertNotification[]>([]);
	const { user, isAuthenticated } = useAuth();

	// Use a ref to store the socket instance
	const socketRef = useRef<Socket | null>(null);

	// Track if we've already connected
	const hasConnected = useRef(false);
	const retryCount = useRef(0);
	const maxRetries = 5;
	const reconnectDelay = 2000;

	// Function to dismiss a notification
	const dismissNotification = useCallback((alertId: string) => {
		setNotifications((prev) =>
			prev.filter((notification) => notification.alertId !== alertId)
		);
	}, []);

	// Setup socket connection
	useEffect(() => {
		// Only attempt connection if authenticated
		if (!isAuthenticated || !user?.userId) {
			setConnectionStatus("disconnected");
			return;
		}

		// Prevent duplicate connections
		if (hasConnected.current && socketRef.current?.connected) return;

		const connectSocket = () => {
			setConnectionStatus("connecting");

			// Create Socket.io connection
			const socketIo = io(SOCKET_URL, {
				transports: ["websocket", "polling"],
				reconnectionAttempts: maxRetries,
				reconnectionDelay: reconnectDelay,
				query: {
					userId: user.userId,
				},
			});

			socketRef.current = socketIo;

			// Connection opened
			socketIo.on("connect", () => {
				console.log("Socket.io connected");
				setIsConnected(true);
				setConnectionStatus("connected");
				hasConnected.current = true;
				retryCount.current = 0;

				// Subscribe to alerts for this user
				socketIo.emit("subscribeAlerts", user.userId);
			});

			// Handle different message types
			socketIo.on("connectionConfirmed", (data) => {
				console.log("Connection confirmed with socket ID:", data.socketId);
			});

			socketIo.on("subscriptionConfirmed", (data) => {
				console.log("Alert subscription confirmed for user:", data.userId);
			});

			socketIo.on("priceUpdate", (data) => {
				setPriceUpdates((prev) => ({
					...prev,
					[data.symbol]: data.price,
				}));
			});

			socketIo.on("alert", (data) => {
				console.log("Alert received:", data);
				// Add notification to state
				const newAlert = {
					symbol: data.symbol,
					price: data.price,
					message: data.message,
					alertId: data.alertId,
				};

				setNotifications((prev) => {
					// Prevent duplicate alerts
					if (prev.some((alert) => alert.alertId === data.alertId)) {
						return prev;
					}
					return [...prev, newAlert];
				});

				// Show a toast notification
				toast(
					<div>
						<strong>Price Alert</strong>
						<p>{data.message}</p>
					</div>,
					{
						icon: <Bell className="h-4 w-4" />,
					}
				);
			});

			// Connection closed
			socketIo.on("disconnect", () => {
				console.log("Socket.io disconnected");
				setIsConnected(false);
				setConnectionStatus("disconnected");
			});

			// Connection error
			socketIo.on("connect_error", (error) => {
				console.error("Socket.io connection error:", error);
				setConnectionStatus("error");

				if (retryCount.current < maxRetries) {
					retryCount.current += 1;
					console.log(
						`Retrying connection (${retryCount.current}/${maxRetries})...`
					);
				} else {
					toast(
						<div>
							<strong>Connection Error</strong>
							<p>Failed to connect to real-time updates</p>
						</div>,
						{
							icon: <AlertCircle className="h-4 w-4" />,
						}
					);
				}
			});
		};

		connectSocket();

		// Clean up on unmount
		return () => {
			if (socketRef.current) {
				console.log("Cleaning up socket connection");
				socketRef.current.disconnect();
				socketRef.current = null;
				hasConnected.current = false;
			}
		};
	}, [user?.userId, isAuthenticated]); // Only depend on `user?.userId` and `isAuthenticated`

	return (
		<WebSocketContext.Provider
			value={{
				isConnected,
				priceUpdates,
				notifications,
				dismissNotification,
				connectionStatus,
			}}
		>
			{children}
		</WebSocketContext.Provider>
	);
};

export const useWebSocket = (): WebSocketContextType => {
	const context = useContext(WebSocketContext);
	if (!context) {
		throw new Error("useWebSocket must be used within a WebSocketProvider");
	}
	return context;
};
