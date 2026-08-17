"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrainFlowLogo } from "@/components/brand/brainflow-logo";
import type { UserRegistrationData } from "@/types/user.types";

const initialRegisterForm: UserRegistrationData = {
    username: "",
    email: "",
    password: "",
};

interface AuthPageProps {
    defaultSignUp?: boolean;
}

export default function AuthPage({ defaultSignUp = false }: AuthPageProps) {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(defaultSignUp);

    // Sync isSignUp state with defaultSignUp prop when it changes
    useEffect(() => {
        setIsSignUp(defaultSignUp);
    }, [defaultSignUp]);

    // Password visibility states
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

    // Login Form State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Register Form State
    const [registerForm, setRegisterForm] = useState<UserRegistrationData>(initialRegisterForm);
    const [registerError, setRegisterError] = useState("");
    const [registerSuccess, setRegisterSuccess] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    const toggleMode = () => {
        const nextMode = !isSignUp;
        setIsSignUp(nextMode);
        // Synchronize the browser URL smoothly without reloading the page
        window.history.pushState(null, "", nextMode ? "/register" : "/login");
        // Clear errors when switching
        setLoginError("");
        setRegisterError("");
        setRegisterSuccess("");
    };

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoginError("");
        setIsLoggingIn(true);

        try {
            const response = await fetch("http://localhost:8080/api/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });

            const data: unknown = await response.json().catch(() => null);

            if (response.ok && response.status === 200) {
                if (
                    typeof data === "object" &&
                    data !== null &&
                    "token" in data &&
                    typeof (data as { token?: unknown }).token === "string"
                ) {
                    const token = (data as { token: string }).token;
                    localStorage.setItem("token", token);

                    const meResponse = await fetch("http://localhost:8080/api/users/me", {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    const meData: unknown = await meResponse.json().catch(() => null);

                    if (
                        meResponse.ok &&
                        meResponse.status === 200 &&
                        typeof meData === "object" &&
                        meData !== null &&
                        "systemRole" in meData &&
                        (meData as { systemRole?: unknown }).systemRole === "ADMIN"
                    ) {
                        localStorage.setItem("role", "ADMIN");
                        router.push("/admin-dashboard");
                        return;
                    }

                    if (
                        meResponse.ok &&
                        meResponse.status === 200 &&
                        typeof meData === "object" &&
                        meData !== null &&
                        "systemRole" in meData &&
                        (meData as { systemRole?: unknown }).systemRole === "ANIMATOR"
                    ) {
                        localStorage.setItem("role", "ANIMATOR");
                        router.push("/animator-dashboard");
                        return;
                    }

                    if (
                        meResponse.ok &&
                        meResponse.status === 200 &&
                        typeof meData === "object" &&
                        meData !== null &&
                        "systemRole" in meData &&
                        (meData as { systemRole?: unknown }).systemRole === "USER"
                    ) {
                        localStorage.setItem("role", "USER");
                        router.push("/user-dashboard");
                        return;
                    }

                    localStorage.removeItem("token");
                    setLoginError("Impossible de déterminer le rôle utilisateur.");
                    return;
                }

                setLoginError("Connexion réussie, mais le token JWT est introuvable.");
                return;
            }

            if (
                typeof data === "object" &&
                data !== null &&
                "message" in data &&
                typeof (data as { message?: unknown }).message === "string"
            ) {
                setLoginError((data as { message: string }).message);
                return;
            }

            if (response.status === 401) {
                setLoginError("Identifiants invalides. Vérifiez votre email et mot de passe.");
                return;
            }

            setLoginError("Échec de connexion. Veuillez réessayer.");
        } catch {
            setLoginError("Impossible de contacter le serveur.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRegisterForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setRegisterError("");
        setRegisterSuccess("");
        setIsRegistering(true);

        try {
            const response = await fetch("http://localhost:8080/api/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(registerForm),
            });

            if (response.status === 201) {
                setRegisterSuccess("Inscription réussie. Redirection vers la connexion...");
                setRegisterForm(initialRegisterForm);
                setTimeout(() => {
                    // Switch to Login view smoothly
                    setIsSignUp(false);
                    window.history.pushState(null, "", "/login");
                    setRegisterSuccess("");
                }, 1200);
                return;
            }

            let backendMessage = "Une erreur est survenue lors de l'inscription.";

            try {
                const errorPayload: unknown = await response.json();
                if (
                    typeof errorPayload === "object" &&
                    errorPayload !== null &&
                    "message" in errorPayload &&
                    typeof (errorPayload as { message?: unknown }).message === "string"
                ) {
                    backendMessage = (errorPayload as { message: string }).message;
                }
            } catch {
                const textMessage = await response.text();
                if (textMessage) {
                    backendMessage = textMessage;
                }
            }

            setRegisterError(backendMessage);
        } catch {
            setRegisterError("Impossible de contacter le serveur.");
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center bg-[#f3f0ea] px-4 py-12 text-[#1a1f2c] overflow-hidden select-none font-sans">
            {/* Background decorative elements for rich aesthetics */}
            <div className="absolute top-[-10%] left-[-10%] h-[350px] w-[350px] rounded-full bg-gradient-to-br from-white/40 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[350px] w-[350px] rounded-full bg-gradient-to-tr from-[#dad7d1]/50 to-transparent blur-3xl pointer-events-none" />

            {/* Brand Logo Floating */}
            <div className="absolute top-6 left-6 z-50">
                <BrainFlowLogo href="/" />
            </div>

            {/* Responsive Container */}
            <div className="relative w-full max-w-4xl min-h-[640px] bg-[#f3f0ea] rounded-[2.5rem] shadow-neu-flat overflow-hidden flex flex-col justify-between p-6 lg:p-0 lg:flex-row lg:h-[640px]">
                
                {/* ========================================================= */}
                {/* DESKTOP LAYOUT (visible on lg screens and above) */}
                {/* ========================================================= */}
                
                {/* Sign In Form Component */}
                <div className={`hidden lg:flex absolute left-0 top-0 w-1/2 h-full flex-col justify-center px-16 py-10 transition-all duration-700 ease-in-out ${
                    isSignUp ? "translate-x-12 opacity-0 pointer-events-none z-10" : "translate-x-0 opacity-100 pointer-events-auto z-20"
                }`}>
                    <form className="space-y-6" onSubmit={handleLoginSubmit}>
                        <div className="space-y-2 text-center lg:text-left">
                            <h2 className="text-3xl font-bold tracking-tight text-[#1b202e]">Se connecter</h2>
                            <p className="text-sm text-slate-500">Accédez à votre espace professionnel BrainFlow.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="login-email">
                                    Email
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                        </svg>
                                    </span>
                                    <input
                                        className="w-full rounded-2xl neu-input pl-12 pr-4 py-3.5 text-sm text-[#1a1f2c] placeholder:text-slate-400"
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="vous@entreprise.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="login-password">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                        </svg>
                                    </span>
                                    <input
                                        className="w-full rounded-2xl neu-input pl-12 pr-12 py-3.5 text-sm text-[#1a1f2c] placeholder:text-slate-400"
                                        id="login-password"
                                        name="password"
                                        type={showLoginPassword ? "text" : "password"}
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="Entrez votre mot de passe"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition"
                                    >
                                        {showLoginPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815L21 21m-3.956-3.956-3.09-3.09m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {loginError ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-rose-700 shadow-neu-inset-sm">
                                {loginError}
                            </div>
                        ) : null}

                        <button
                            className="w-full py-3.5 rounded-2xl font-bold tracking-wide neu-btn-dark cursor-pointer flex items-center justify-center gap-2"
                            type="submit"
                            disabled={isLoggingIn}
                        >
                            {isLoggingIn ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Connexion...
                                </>
                            ) : "Se connecter"}
                        </button>
                    </form>
                </div>

                {/* Sign Up Form Component */}
                <div className={`hidden lg:flex absolute right-0 top-0 w-1/2 h-full flex-col justify-center px-16 py-10 transition-all duration-700 ease-in-out ${
                    isSignUp ? "translate-x-0 opacity-100 pointer-events-auto z-20" : "-translate-x-12 opacity-0 pointer-events-none z-10"
                }`}>
                    <form className="space-y-5" onSubmit={handleRegisterSubmit}>
                        <div className="space-y-2 text-center lg:text-left">
                            <h2 className="text-3xl font-bold tracking-tight text-[#1b202e]">S&apos;inscrire</h2>
                            <p className="text-sm text-slate-500">Créez votre compte collaborateur BrainFlow.</p>
                        </div>

                        <div className="space-y-3.5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="register-username">
                                    Nom complet
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                        </svg>
                                    </span>
                                    <input
                                        className="w-full rounded-2xl neu-input pl-12 pr-4 py-3.5 text-sm text-[#1a1f2c] placeholder:text-slate-400"
                                        id="register-username"
                                        name="username"
                                        type="text"
                                        value={registerForm.username}
                                        onChange={handleRegisterChange}
                                        placeholder="Ex. Jean Dupont"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="register-email">
                                    Email
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                        </svg>
                                    </span>
                                    <input
                                        className="w-full rounded-2xl neu-input pl-12 pr-4 py-3.5 text-sm text-[#1a1f2c] placeholder:text-slate-400"
                                        id="register-email"
                                        name="email"
                                        type="email"
                                        value={registerForm.email}
                                        onChange={handleRegisterChange}
                                        placeholder="vous@entreprise.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="register-password">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                        </svg>
                                    </span>
                                    <input
                                        className="w-full rounded-2xl neu-input pl-12 pr-12 py-3.5 text-sm text-[#1a1f2c] placeholder:text-slate-400"
                                        id="register-password"
                                        name="password"
                                        type={showRegisterPassword ? "text" : "password"}
                                        value={registerForm.password}
                                        onChange={handleRegisterChange}
                                        placeholder="Créez un mot de passe"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition"
                                    >
                                        {showRegisterPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815L21 21m-3.956-3.956-3.09-3.09m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {registerError ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-rose-700 shadow-neu-inset-sm">
                                {registerError}
                            </div>
                        ) : null}

                        {registerSuccess ? (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-700 shadow-neu-inset-sm">
                                {registerSuccess}
                            </div>
                        ) : null}

                        <button
                            className="w-full py-3.5 rounded-2xl font-bold tracking-wide neu-btn-dark cursor-pointer flex items-center justify-center gap-2"
                            type="submit"
                            disabled={isRegistering}
                        >
                            {isRegistering ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Inscription...
                                </>
                            ) : "S'inscrire"}
                        </button>
                    </form>
                </div>

                {/* Sliding Cover Panel Component */}
                <div className={`hidden lg:block absolute top-0 left-0 w-1/2 h-full z-30 transition-transform duration-700 ease-in-out overflow-hidden bg-gradient-to-br from-[#1b202e] to-[#2d364f] shadow-neu-flat ${
                    isSignUp ? "translate-x-0 rounded-l-[2.5rem] rounded-r-[100px]" : "translate-x-full rounded-r-[2.5rem] rounded-l-[100px]"
                }`}>
                    {/* Inner content container - moves opposite of sliding panel to look steady or switch */}
                    <div className={`w-[200%] h-full flex transition-transform duration-700 ease-in-out ${
                        isSignUp ? "-translate-x-1/2" : "translate-x-0"
                    }`}>
                        
                        {/* Slide Left (visible when isSignUp is false) */}
                        <div className="w-1/2 h-full flex flex-col justify-center items-center px-16 text-center text-white space-y-6">
                            <h3 className="text-3.5xl font-extrabold tracking-tight">Welcome Back !</h3>
                            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
                                Pour rester connecté avec vos tableaux de bord et vos équipes, veuillez vous identifier.
                            </p>
                            <button
                                onClick={toggleMode}
                                className="px-10 py-3 border-2 border-white/20 hover:bg-white/10 hover:border-white/40 active:scale-[0.98] text-white font-bold rounded-2xl transition duration-300 cursor-pointer shadow-sm shadow-black/20"
                            >
                                Se connecter
                            </button>
                        </div>

                        {/* Slide Right (visible when isSignUp is true) */}
                        <div className="w-1/2 h-full flex flex-col justify-center items-center px-16 text-center text-white space-y-6">
                            <h3 className="text-3.5xl font-extrabold tracking-tight">Nouveau ici ?</h3>
                            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
                                Rejoignez l&apos;expérience BrainFlow et créez votre compte pour organiser des sessions collaboratives avec vos équipes.
                            </p>
                            <button
                                onClick={toggleMode}
                                className="px-10 py-3 border-2 border-white/20 hover:bg-white/10 hover:border-white/40 active:scale-[0.98] text-white font-bold rounded-2xl transition duration-300 cursor-pointer shadow-sm shadow-black/20"
                            >
                                S&apos;inscrire
                            </button>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* MOBILE/TABLET LAYOUT (visible below lg screens) */}
                {/* ========================================================= */}
                <div className="flex lg:hidden flex-col w-full space-y-6 pt-12">
                    
                    {/* Neumorphic Sliding Tabs */}
                    <div className="relative flex w-full h-13 bg-[#f3f0ea] rounded-2xl shadow-neu-inset p-1.5 items-center">
                        <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#1b202e] rounded-xl transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
                            isSignUp ? "left-[calc(50%+3px)]" : "left-1.5"
                        }`} />
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(false);
                                window.history.pushState(null, "", "/login");
                            }}
                            className={`flex-1 text-center font-bold text-sm py-2 z-10 transition duration-300 ${
                                !isSignUp ? "text-white" : "text-slate-500"
                            }`}
                        >
                            Se connecter
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(true);
                                window.history.pushState(null, "", "/register");
                            }}
                            className={`flex-1 text-center font-bold text-sm py-2 z-10 transition duration-300 ${
                                isSignUp ? "text-white" : "text-slate-500"
                            }`}
                        >
                            S&apos;inscrire
                        </button>
                    </div>

                    {/* Sliding Forms Wrapper */}
                    <div className="overflow-hidden w-full relative min-h-[460px]">
                        <div className={`w-[200%] flex transition-transform duration-500 ease-in-out h-full ${
                            isSignUp ? "-translate-x-1/2" : "translate-x-0"
                        }`}>
                            
                            {/* Sign In (Mobile) */}
                            <div className="w-1/2 px-2 h-full flex flex-col justify-between">
                                <form className="space-y-5" onSubmit={handleLoginSubmit}>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="mobile-login-email">
                                                Email
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                                    </svg>
                                                </span>
                                                <input
                                                    className="w-full rounded-2xl neu-input pl-12 pr-4 py-3.5 text-sm"
                                                    id="mobile-login-email"
                                                    type="email"
                                                    value={loginEmail}
                                                    onChange={(e) => setLoginEmail(e.target.value)}
                                                    placeholder="vous@entreprise.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="mobile-login-password">
                                                Mot de passe
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                    </svg>
                                                </span>
                                                <input
                                                    className="w-full rounded-2xl neu-input pl-12 pr-12 py-3.5 text-sm"
                                                    id="mobile-login-password"
                                                    type={showLoginPassword ? "text" : "password"}
                                                    value={loginPassword}
                                                    onChange={(e) => setLoginPassword(e.target.value)}
                                                    placeholder="Votre mot de passe"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition"
                                                >
                                                    {showLoginPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815L21 21m-3.956-3.956-3.09-3.09m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {loginError ? (
                                        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-rose-700 shadow-neu-inset-sm">
                                            {loginError}
                                        </div>
                                    ) : null}

                                    <button
                                        className="w-full py-3.5 rounded-2xl font-bold tracking-wide neu-btn-dark cursor-pointer flex items-center justify-center gap-2"
                                        type="submit"
                                        disabled={isLoggingIn}
                                    >
                                        {isLoggingIn ? "Connexion..." : "Se connecter"}
                                    </button>
                                </form>
                            </div>

                            {/* Sign Up (Mobile) */}
                            <div className="w-1/2 px-2 h-full flex flex-col justify-between">
                                <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                                    <div className="space-y-3.5">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="mobile-register-username">
                                                Nom complet
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                    </svg>
                                                </span>
                                                <input
                                                    className="w-full rounded-2xl neu-input pl-12 pr-4 py-3 text-sm"
                                                    id="mobile-register-username"
                                                    name="username"
                                                    type="text"
                                                    value={registerForm.username}
                                                    onChange={handleRegisterChange}
                                                    placeholder="Ex. Jean Dupont"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="mobile-register-email">
                                                Email
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                                    </svg>
                                                </span>
                                                <input
                                                    className="w-full rounded-2xl neu-input pl-12 pr-4 py-3 text-sm"
                                                    id="mobile-register-email"
                                                    name="email"
                                                    type="email"
                                                    value={registerForm.email}
                                                    onChange={handleRegisterChange}
                                                    placeholder="vous@entreprise.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1" htmlFor="mobile-register-password">
                                                Mot de passe
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                    </svg>
                                                </span>
                                                <input
                                                    className="w-full rounded-2xl neu-input pl-12 pr-12 py-3 text-sm"
                                                    id="mobile-register-password"
                                                    name="password"
                                                    type={showRegisterPassword ? "text" : "password"}
                                                    value={registerForm.password}
                                                    onChange={handleRegisterChange}
                                                    placeholder="Créez un mot de passe"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition"
                                                >
                                                    {showRegisterPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815L21 21m-3.956-3.956-3.09-3.09m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {registerError ? (
                                        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-rose-700 shadow-neu-inset-sm">
                                            {registerError}
                                        </div>
                                    ) : null}

                                    {registerSuccess ? (
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-700 shadow-neu-inset-sm">
                                            {registerSuccess}
                                        </div>
                                    ) : null}

                                    <button
                                        className="w-full py-3.5 rounded-2xl font-bold tracking-wide neu-btn-dark cursor-pointer flex items-center justify-center gap-2"
                                        type="submit"
                                        disabled={isRegistering}
                                    >
                                        {isRegistering ? "Inscription..." : "S'inscrire"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
