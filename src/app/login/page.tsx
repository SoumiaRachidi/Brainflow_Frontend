"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { BrainFlowLogo } from "@/components/brand/brainflow-logo";

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
                        (meData as { systemRole?: unknown }).systemRole === "ANIMATOR"
                    ) {
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
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3f9_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
            <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_1.1fr]">
                <div className="flex flex-col justify-between gap-8 bg-slate-50 p-8 sm:p-10">
                    <div className="space-y-6">
                        <BrainFlowLogo href="/login" />
                        <div className="space-y-3">
                            <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                                Connectez-vous à votre espace BrainFlow
                            </h1>
                            <p className="max-w-xl text-base leading-7 text-slate-600">
                                Un point d&apos;entrée clair, sécurisé et conçu pour accéder rapidement aux tableaux de bord administrateur ou utilisateur.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sécurité</p>
                            <p className="mt-3 text-sm font-medium text-slate-900">Token validé à la connexion</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Rôles</p>
                            <p className="mt-3 text-sm font-medium text-slate-900">Redirection automatique selon le profil</p>
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Design</p>
                            <p className="mt-3 text-sm font-medium text-slate-900">Interface claire et professionnelle</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center p-8 sm:p-10">
                    <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
                        <div className="space-y-3 text-center">
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Se connecter</h2>
                            <p className="text-sm text-slate-500">Accédez à BrainFlow avec vos identifiants professionnels.</p>
                        </div>

                        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
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
                                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                                    Mot de passe
                                </label>
                                <input
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
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
                                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {errorMessage}
                                </p>
                            ) : null}

                            <button
                                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? "Connexion en cours..." : "Se connecter"}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}
