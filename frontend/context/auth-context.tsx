"use client";

import {
	createContext,
	useState,
	useEffect,
	useContext,
	ReactNode,
} from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

interface User {
	userId: string;
	email: string;
	name: string;
}

interface AuthContextType {
	user: User | null;
	login: (email: string, password: string) => Promise<void>;
	signup: (name: string, email: string, password: string) => Promise<void>;
	logout: () => void;
	isAuthenticated: boolean;
	showLoginModal: boolean;
	showSignupModal: boolean;
	openLoginModal: () => void;
	openSignupModal: () => void;
	closeModals: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [showSignupModal, setShowSignupModal] = useState(false);

	const router = useRouter();

	// Load user from token on page refresh
	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token) {
			try {
				const decoded = jwtDecode<User & { exp: number }>(token); // Include 'exp' field
				const currentTime = Date.now() / 1000; // Convert to seconds

				if (decoded.exp < currentTime) {
					console.error("Token expired");
					logout();
				} else {
					setUser(decoded);
					setIsAuthenticated(true);
				}
			} catch (error) {
				console.error("Invalid token", error);
				logout();
			}
		}
	}, []);

	const login = async (email: string, password: string) => {
		const res = await axios.post(
			"https://watchdog-c8e1.onrender.com/api/auth/login",
			{ email, password }
		);
		localStorage.setItem("token", res.data.token);
		setUser(jwtDecode<User>(res.data.token));
		setIsAuthenticated(true);
		closeModals();
		router.push("/dashboard"); // Redirect to a protected route
	};

	const signup = async (name: string, email: string, password: string) => {
		const res = await axios.post(
			"https://watchdog-c8e1.onrender.com/api/auth/signup",
			{
				name,
				email,
				password,
			}
		);

		localStorage.setItem("token", res.data.token);
		console.log("token", res.data.token);
		setUser(jwtDecode<User>(res.data.token));
		setIsAuthenticated(true);
		closeModals();
		window.location.reload();
	};

	const logout = () => {
		localStorage.removeItem("token");
		setUser(null);
		setIsAuthenticated(false);
		window.location.reload();
	};

	const openLoginModal = () => {
		setShowSignupModal(false);
		setShowLoginModal(true);
	};

	const openSignupModal = () => {
		setShowLoginModal(false);
		setShowSignupModal(true);
	};

	const closeModals = () => {
		setShowLoginModal(false);
		setShowSignupModal(false);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				login,
				signup,
				logout,
				isAuthenticated,
				showLoginModal,
				showSignupModal,
				openLoginModal,
				openSignupModal,
				closeModals,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
