const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
	console.log("Connected to server!");
	console.log("Socket ID:", socket.id);

	// Subscribe to alerts
	socket.emit("subscribeAlerts", "testuser123");
});

socket.on("connectionConfirmed", (data) => {
	console.log("Connection confirmed:", data);
});

socket.on("subscriptionConfirmed", (data) => {
	console.log("Subscription confirmed:", data);
});

socket.on("priceUpdate", (data) => {
	console.log("Price update received:", data);
});

socket.on("disconnect", () => {
	console.log("Disconnected from server");
});

socket.on("connect_error", (error) => {
	console.log("Connection error:", error.message);
});
