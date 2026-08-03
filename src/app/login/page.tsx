"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8080/api/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
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
                        router.push("/admin-dashboard");
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
                        router.push("/user-dashboard");
                        return;
                    }

                    localStorage.removeItem("token");
                    setErrorMessage("Impossible de déterminer le rôle utilisateur.");
                    return;
                }

                setErrorMessage("Connexion réussie, mais le token JWT est introuvable.");
                return;
            }

            if (
                typeof data === "object" &&
                data !== null &&
                "message" in data &&
                typeof (data as { message?: unknown }).message === "string"
            ) {
                setErrorMessage((data as { message: string }).message);
                return;
            }

            if (response.status === 401) {
                setErrorMessage("Identifiants invalides. Vérifiez votre email et mot de passe.");
                return;
            }

            setErrorMessage("Échec de connexion. Veuillez réessayer.");
        } catch {
            setErrorMessage("Impossible de contacter le serveur.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100 sm:px-6 lg:px-8">
            <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-white">
                        Se connecter
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Connectez-vous pour accéder a votre espace BrainFlow.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-200" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="vous@entreprise.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-200" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Entrez votre mot de passe"
                            required
                        />
                    </div>

                    {errorMessage ? (
                        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {errorMessage}
                        </p>
                    ) : null}

                    <button
                        className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? "Connexion en cours..." : "Se connecter"}
                    </button>
                </form>
            </section>
        </main>
    );
}
