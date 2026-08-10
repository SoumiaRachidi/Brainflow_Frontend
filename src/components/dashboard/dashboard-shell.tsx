"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { BrainFlowLogo } from "@/components/brand/brainflow-logo";
import type { AuthenticatedUser, DashboardRole } from "@/types/user.types";

const API_BASE_URL = "http://localhost:8080";

type DashboardTone = "sky" | "indigo" | "emerald" | "slate" | "violet";

type SidebarItem = {
    id?: string;
    label: string;
    description: string;
    href: string;
    tone: DashboardTone;
};

type DashboardShellProps = {
    requiredRole: DashboardRole;
    title: string;
    subtitle: string;
    sidebarItems: SidebarItem[];
    children: ReactNode;
    onUserLoaded?: (user: AuthenticatedUser) => void;
};

const toneClasses: Record<DashboardTone, string> = {
    sky: "border-sky-200 bg-sky-50 text-sky-600",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-600",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
    slate: "border-slate-200 bg-slate-50 text-slate-500",
    violet: "border-violet-200 bg-violet-50 text-violet-600",
};

export function DashboardShell({ requiredRole, title, subtitle, sidebarItems, children, onUserLoaded }: DashboardShellProps) {
    const router = useRouter();
    const [user, setUser] = useState<AuthenticatedUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [compactSidebar, setCompactSidebar] = useState(false);

    useEffect(() => {
        const loadCurrentUser = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                router.replace("/login");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/users/me`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Unauthorized");
                }

                const me: AuthenticatedUser = await response.json();

                if (me.systemRole !== requiredRole) {
                    if (me.systemRole === "ADMIN") {
                        router.replace("/admin-dashboard");
                    } else if (me.systemRole === "ANIMATOR") {
                        router.replace("/animator-dashboard");
                    } else {
                        router.replace("/user-dashboard");
                    }
                    return;
                }

                setUser(me);
                onUserLoaded?.(me);
            } catch {
                localStorage.removeItem("token");
                router.replace("/login");
            } finally {
                setLoading(false);
            }
        };

        void loadCurrentUser();
    }, [onUserLoaded, requiredRole, router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.replace("/login");
    };

    const userInitial = useMemo(() => {
        if (!user?.email) {
            return "BF";
        }

        return user.email.split("@")[0].slice(0, 2).toUpperCase();
    }, [user]);

    const dashboardHref = requiredRole === "ADMIN"
        ? "/admin-dashboard"
        : requiredRole === "ANIMATOR"
            ? "/animator-dashboard"
            : "/user-dashboard";

    if (loading || !user) {
        return (
            <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3f9_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
                <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1600px] gap-6">
                    <aside className="hidden w-80 overflow-hidden flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:flex">
                        <div className="space-y-4">
                            <BrainFlowLogo href={dashboardHref} />
                            <div className="h-4 w-44 rounded-full bg-slate-100" />
                        </div>
                        <div className="space-y-3">
                            {sidebarItems.map((item, index) => (
                                <div key={item.id || index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <div className={`mb-3 h-3 w-12 rounded-full border ${toneClasses[item.tone]}`} />
                                    <div className="h-4 w-32 rounded-full bg-slate-100" />
                                    <div className="mt-3 h-3 w-full rounded-full bg-slate-100" />
                                </div>
                            ))}
                        </div>
                    </aside>

                    <div className="flex flex-1 flex-col gap-6">
                        <header className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-28 rounded-full bg-slate-100" />
                                    <div className="h-3 w-64 rounded-full bg-slate-100" />
                                </div>
                                <div className="h-11 w-36 rounded-2xl bg-slate-100" />
                            </div>
                        </header>

                        <section className="flex flex-1 items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-10 text-sm text-slate-500 shadow-sm">
                            Chargement sécurisé de l&apos;espace {title.toLowerCase()}...
                        </section>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3f9_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1600px] gap-6">
                <aside
                    className={`hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 lg:flex lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] ${
                        compactSidebar
                            ? "flex-col items-center justify-center gap-6 p-4 lg:w-24"
                            : "flex-col gap-6 p-6 lg:w-80"
                    }`}
                >
                    <div className={`flex w-full ${compactSidebar ? "flex-col items-center justify-center gap-4" : "items-start justify-between gap-4"}`}>
                        <BrainFlowLogo href={dashboardHref} compact={compactSidebar} />
                        <button
                            type="button"
                            onClick={() => setCompactSidebar((current) => !current)}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                            aria-label={compactSidebar ? "Agrandir la barre latérale" : "Compacter la barre latérale"}
                            title={compactSidebar ? "Agrandir la barre latérale" : "Compacter la barre latérale"}
                        >
                            {compactSidebar ? "›" : "‹"}
                        </button>
                    </div>

                    {compactSidebar ? (
                        <div
                            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                            title={`Rôle : ${requiredRole === "ADMIN" ? "Admin" : requiredRole === "ANIMATOR" ? "Animateur" : "Utilisateur"}`}
                        >
                            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500" />
                            {requiredRole === "ADMIN" ? (
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            ) : requiredRole === "ANIMATOR" ? (
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            )}
                        </div>
                    ) : (
                        <div className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">RÔLE ACTIF</p>
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
                                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                                {requiredRole}
                            </div>
                        </div>
                    )}

                    <nav className={`flex w-full flex-col ${compactSidebar ? "items-center justify-center gap-3" : "space-y-2"}`}>
                        {sidebarItems.map((item, index) => (
                            <a
                                key={item.id || index}
                                href={item.href}
                                title={compactSidebar ? item.label : undefined}
                                className={
                                    compactSidebar
                                        ? "group flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/60"
                                        : "group flex items-start gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/60"
                                }
                            >
                                <span
                                    className={`${compactSidebar ? "" : "mt-1"} h-3 w-3 rounded-full border ${toneClasses[item.tone]}`}
                                />
                                {!compactSidebar ? (
                                    <span className="space-y-1">
                                        <span className="block text-sm font-semibold text-slate-900 transition group-hover:text-sky-700">
                                            {item.label}
                                        </span>
                                        <span className="block text-xs leading-5 text-slate-500">{item.description}</span>
                                    </span>
                                ) : null}
                            </a>
                        ))}
                    </nav>
                </aside>

                <div className="flex flex-1 flex-col gap-6">
                    <header className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-sky-700/70">BrainFlow workspace</p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h2>
                                <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                    type="button"
                                    onClick={() => setCompactSidebar((current) => !current)}
                                >
                                    {compactSidebar ? "Étendre la barre" : "Compacter la barre"}
                                </button>

                                <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-500 text-sm font-semibold text-white">
                                        {userInitial}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Connecté</p>
                                        <p className="truncate text-sm font-medium text-slate-900">{user.email ?? "Utilisateur connecté"}</p>
                                    </div>
                                </div>

                                <button
                                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                                    type="button"
                                    onClick={handleLogout}
                                >
                                    Déconnexion
                                </button>
                            </div>
                        </div>
                    </header>

                    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                        {children}
                    </section>
                </div>
            </div>
        </main>
    );
}