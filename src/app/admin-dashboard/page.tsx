"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DashboardUser = {
    id?: number;
    username?: string;
    email?: string;
    systemRole?: string;
    [key: string]: unknown;
};

export default function AdminDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<DashboardUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                router.replace("/login");
                return;
            }

            try {
                const response = await fetch("http://localhost:8080/api/users/me", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    localStorage.removeItem("token");
                    router.replace("/login");
                    return;
                }

                const data: DashboardUser = await response.json();

                if (data.systemRole === "USER") {
                    router.replace("/user-dashboard");
                    return;
                }

                setUser(data);
            } catch {
                localStorage.removeItem("token");
                router.replace("/login");
                return;
            } finally {
                setLoading(false);
            }
        };

        void loadUser();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.replace("/login");
    };

    return (
        <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100 sm:px-6 lg:px-8">
            <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-white">
                        Panneau d'administration - Statistiques et gestion des utilisateurs
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Vérification de l&apos;authentification et contrôle d&apos;accès côté administration.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/70 px-6 py-10 text-sm text-zinc-300">
                        Chargement du panneau d&apos;administration...
                    </div>
                ) : user ? (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-6 py-5">
                            <p className="text-sm uppercase tracking-[0.2em] text-fuchsia-300">
                                Administrateur connecté
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold text-white">
                                {user.username ?? "Administrateur"}
                            </h2>
                            <p className="mt-1 text-sm text-zinc-300">
                                {user.email ?? "Aucun email renseigné"}
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                    Username
                                </p>
                                <p className="mt-2 text-base font-medium text-white">
                                    {user.username ?? "Non renseigné"}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                    Email
                                </p>
                                <p className="mt-2 text-base font-medium text-white">
                                    {user.email ?? "Non renseigné"}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                    Rôle
                                </p>
                                <p className="mt-2 text-base font-medium text-white">
                                    {user.systemRole ?? "Non renseigné"}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-sm text-zinc-300">
                                Statistiques des sessions
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-sm text-zinc-300">
                                Gestion des utilisateurs
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-sm text-zinc-300">
                                Suivi des accès
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                className="inline-flex items-center justify-center rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400"
                                type="button"
                                onClick={handleLogout}
                            >
                                Se déconnecter
                            </button>
                        </div>
                    </div>
                ) : null}
            </section>
        </main>
    );
}
