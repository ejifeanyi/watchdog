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

interface User {
	id: string;
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

	// Load user from token on page refresh
	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token) {
			try {
				const decoded = jwtDecode<User>(token);
				setUser(decoded);
				setIsAuthenticated(true);
			} catch (error) {
				console.error("Invalid token", error);
				logout();
			}
		}
	}, []);

	const login = async (email: string, password: string) => {
		const res = await axios.post("http://localhost:5000/api/auth/login", {
			email,
			password,
		});
		localStorage.setItem("token", res.data.token);
		setUser(jwtDecode<User>(res.data.token));
		setIsAuthenticated(true);
		closeModals();
	};

	const signup = async (name: string, email: string, password: string) => {
		const res = await axios.post("http://localhost:5000/api/auth/signup", {
			name,
			email,
			password,
		});

		// 🔹 If signup is successful, log in the user automatically
		localStorage.setItem("token", res.data.token);
		setUser(jwtDecode<User>(res.data.token));
		setIsAuthenticated(true);
		closeModals();
	};


	const logout = () => {
		localStorage.removeItem("token");
		setUser(null);
		setIsAuthenticated(false);
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
