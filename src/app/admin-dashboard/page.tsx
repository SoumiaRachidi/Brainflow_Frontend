"use client";

import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type {
    AdminTableUser,
    AuthenticatedUser,
    DashboardMetric,
    DashboardMetricsApiResponse,
} from "@/types/user.types";

const API_BASE_URL = "http://localhost:8080";

type AdminDashboardState = {
    metrics: DashboardMetric[];
    users: AdminTableUser[];
    loading: boolean;
    errorMessage: string;
    actionMessage: string;
};

const sidebarItems = [
    {
        label: "Vue d'ensemble",
        description: "Surveillez l'activité globale et les signaux clés.",
        href: "#overview",
        tone: "sky" as const,
    },
    {
        label: "Utilisateurs",
        description: "Consultez les comptes et les permissions.",
        href: "#users",
        tone: "indigo" as const,
    },
    {
        label: "Gouvernance",
        description: "Suivez les accès, alertes et validations.",
        href: "#governance",
        tone: "emerald" as const,
    },
    {
        label: "Configuration",
        description: "Accédez aux préférences et à la maintenance.",
        href: "#configuration",
        tone: "violet" as const,
    },
];

const initialMetrics: DashboardMetric[] = [
    { label: "Sessions actives", value: "--", trend: "Chargement en cours", tone: "sky" },
    { label: "Utilisateurs suivis", value: "--", trend: "Chargement en cours", tone: "indigo" },
    { label: "Sessions validées", value: "--", trend: "Chargement en cours", tone: "emerald" },
    { label: "Signalements ouverts", value: "--", trend: "Chargement en cours", tone: "violet" },
];

const initialUsers: AdminTableUser[] = [];

const toneClasses: Record<DashboardMetric["tone"], string> = {
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export default function AdminDashboardPage() {
    const [state, setState] = useState<AdminDashboardState>({
        metrics: initialMetrics,
        users: initialUsers,
        loading: true,
        errorMessage: "",
        actionMessage: "",
    });

    const scrollToSection = (sectionId: string) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    useEffect(() => {
        const loadAdminDashboard = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setState((current) => ({ ...current, loading: false, errorMessage: "Session introuvable. Veuillez vous reconnecter." }));
                return;
            }

            try {
                const [metricsResponse, usersResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/dashboard/admin/metrics`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API_BASE_URL}/api/users`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (!metricsResponse.ok || !usersResponse.ok) {
                    throw new Error("API failure");
                }

                const metricsData: DashboardMetricsApiResponse = await metricsResponse.json();
                const usersData: unknown = await usersResponse.json();

                const nextMetrics: DashboardMetric[] = [
                    {
                        label: "Sessions actives",
                        value: String(metricsData.sessionsCount ?? 0),
                        trend: "Activité temps réel",
                        tone: "sky",
                    },
                    {
                        label: "Utilisateurs suivis",
                        value: String(metricsData.activeUsersCount ?? 0),
                        trend: "Comptes monitorés",
                        tone: "indigo",
                    },
                    {
                        label: "Sessions validées",
                        value: `${metricsData.validatedSessionsRate ?? 0}%`,
                        trend: "Taux d&apos;adoption",
                        tone: "emerald",
                    },
                    {
                        label: "Signalements ouverts",
                        value: String(metricsData.openIssuesCount ?? 0),
                        trend: "Points de suivi",
                        tone: "violet",
                    },
                ];

                const mappedUsers: AdminTableUser[] = Array.isArray(usersData)
                    ? usersData.slice(0, 8).map((user) => {
                        const currentUser = user as AuthenticatedUser;
                        const status = typeof currentUser.status === "string"
                            ? currentUser.status
                            : currentUser.systemRole === "ADMIN"
                                ? "Administrateur"
                                : "Utilisateur";
                        const lastActive = typeof currentUser.lastActive === "string"
                            ? currentUser.lastActive
                            : "Récemment";

                        return {
                            name: currentUser.username ?? "Utilisateur",
                            email: currentUser.email ?? "Non renseigné",
                            role: currentUser.systemRole ?? "USER",
                            status,
                            lastActive,
                        };
                    })
                    : [];

                setState({
                    metrics: nextMetrics,
                    users: mappedUsers,
                    loading: false,
                    errorMessage: "",
                    actionMessage: "",
                });
            } catch {
                setState((current) => ({
                    ...current,
                    loading: false,
                    errorMessage: "Impossible de charger les statistiques ou les utilisateurs depuis le backend.",
                }));
            }
        };

        void loadAdminDashboard();
    }, []);

    const handleRefresh = () => {
        setState((current) => ({ ...current, loading: true, errorMessage: "", actionMessage: "" }));
        window.location.reload();
    };

    const handleInviteUser = () => {
        setState((current) => ({
            ...current,
            actionMessage: "Action prête: branchez ce bouton à votre endpoint d'invitation ou d'ajout utilisateur.",
        }));
    };

    return (
        <DashboardShell
            requiredRole="ADMIN"
            title="Centre de pilotage administrateur"
            subtitle="Une interface claire et professionnelle pour suivre les indicateurs, superviser les utilisateurs et garder un contrôle rapide sur la plateforme."
            sidebarItems={sidebarItems}
        >
            <div className="space-y-8">
                {state.errorMessage ? (
                    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p>{state.errorMessage}</p>
                            <button type="button" onClick={handleRefresh} className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-700">
                                Réessayer
                            </button>
                        </div>
                    </div>
                ) : null}

                {state.actionMessage ? (
                    <div className="rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-700">
                        {state.actionMessage}
                    </div>
                ) : null}

                <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm lg:p-8">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl space-y-3">
                            <p className="text-xs uppercase tracking-[0.4em] text-sky-700/70">Vue d&apos;ensemble</p>
                            <h3 className="text-3xl font-semibold text-slate-900">Indicateurs de supervision</h3>
                            <p className="text-sm leading-6 text-slate-600">
                                Les métriques ci-dessous offrent une lecture immédiate de l&apos;activité BrainFlow et servent de point d&apos;accès aux principaux contrôles.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => scrollToSection("users")}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                            >
                                Voir les utilisateurs
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollToSection("governance")}
                                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                            >
                                Ouvrir la gouvernance
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {state.loading ? initialMetrics.map((card) => (
                            <article key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="h-4 w-28 rounded-full bg-slate-100" />
                                <div className="mt-6 flex items-end justify-between gap-4">
                                    <div className="h-9 w-16 rounded-full bg-slate-100" />
                                    <div className="h-8 w-24 rounded-full bg-slate-100" />
                                </div>
                            </article>
                        )) : state.metrics.map((card) => (
                            <article key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm font-medium text-slate-600">{card.label}</p>
                                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClasses[card.tone]}`}>
                                        {card.trend}
                                    </span>
                                </div>
                                <div className="mt-6 flex items-end justify-between gap-4">
                                    <span className="text-4xl font-semibold tracking-tight text-slate-900">{card.value}</span>
                                    <span className={`h-10 w-10 rounded-2xl border ${toneClasses[card.tone]}`} />
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="users" className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
                    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.4em] text-indigo-700/70">Gestion des utilisateurs</p>
                                <h3 className="mt-2 text-2xl font-semibold text-slate-900">Accès et présence</h3>
                            </div>
                            <p className="text-sm text-slate-500">Tableau de contrôle prêt pour les actions CRUD et l&apos;audit.</p>
                        </div>

                        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-left">
                                <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">Utilisateur</th>
                                        <th className="px-5 py-4">Rôle</th>
                                        <th className="px-5 py-4">Statut</th>
                                        <th className="px-5 py-4">Dernière activité</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                                    {state.loading ? (
                                        <tr>
                                            <td className="px-5 py-6 text-slate-500" colSpan={4}>Chargement des utilisateurs...</td>
                                        </tr>
                                    ) : state.users.length > 0 ? (
                                        state.users.map((user) => (
                                            <tr key={user.email} className="transition hover:bg-slate-50">
                                                <td className="px-5 py-4">
                                                    <div className="font-medium text-slate-900">{user.name}</div>
                                                    <div className="text-slate-500">{user.email}</div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.role === "ADMIN" ? "bg-sky-50 text-sky-700" : "bg-indigo-50 text-indigo-700"}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-slate-600">{user.status}</td>
                                                <td className="px-5 py-4 text-slate-600">{user.lastActive}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="px-5 py-6 text-slate-500" colSpan={4}>Aucun utilisateur disponible pour le moment.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </article>

                    <aside className="space-y-6" id="governance">
                        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.4em] text-sky-700/70">Gouvernance</p>
                            <h3 className="mt-3 text-xl font-semibold text-slate-900">Contrôles et alertes</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Centralisez les anomalies, les demandes de rôle et les événements sensibles dans un espace dédié.
                            </p>

                            <div className="mt-5 grid gap-3">
                                <button type="button" onClick={handleInviteUser} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
                                    Revoir les accès sensibles
                                </button>
                                <button type="button" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
                                    Exporter le rapport d&apos;activité
                                </button>
                            </div>
                        </article>

                        <article id="configuration" className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-6 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.4em] text-indigo-700/70">Configuration</p>
                            <h3 className="mt-3 text-xl font-semibold text-slate-900">Maintenance rapide</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Branchez ici les raccourcis de supervision, les paramètres globaux et les automatisations.
                            </p>
                        </article>
                    </aside>
                </section>
            </div>
        </DashboardShell>
    );
}
