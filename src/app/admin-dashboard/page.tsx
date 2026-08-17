"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type {
    AdminTableUser,
    AuthenticatedUser,
    DashboardMetric,
    DashboardMetricsApiResponse,
} from "@/types/user.types";

const API_BASE_URL = "http://localhost:8080";

interface AdminDashboardState {
    metrics: DashboardMetric[];
    users: AdminTableUser[];
    loading: boolean;
    errorMessage: string;
    actionMessage: string;
}

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
    sky: "border-white/50 bg-[#f3f0ea] text-sky-700 hover:shadow-neu-flat cursor-pointer shadow-neu-flat-sm",
    indigo: "border-white/50 bg-[#f3f0ea] text-indigo-700 hover:shadow-neu-flat cursor-pointer shadow-neu-flat-sm",
    emerald: "border-white/50 bg-[#f3f0ea] text-emerald-700 hover:shadow-neu-flat cursor-pointer shadow-neu-flat-sm",
    violet: "border-white/50 bg-[#f3f0ea] text-violet-700 hover:shadow-neu-flat cursor-pointer shadow-neu-flat-sm",
};

interface MockIssue {
    id: string;
    title: string;
    date: string;
    author: string;
    status: string;
}

export default function AdminDashboardPage() {
    const router = useRouter();

    const [state, setState] = useState<AdminDashboardState & { sessionsCountVal?: number }>({
        metrics: initialMetrics,
        users: initialUsers,
        loading: true,
        errorMessage: "",
        actionMessage: "",
    });

    // Modals & Interactive States
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [openIssues, setOpenIssues] = useState<MockIssue[]>([
        { id: "iss-1", title: "Contenu inapproprié signalé dans Session #12", date: "Aujourd'hui", author: "sofia@ocp.ma", status: "Ouvert" },
        { id: "iss-2", title: "Problème de connexion WebSocket détecté pour lucas@ocp.ma", date: "Hier", author: "system", status: "Ouvert" },
        { id: "iss-3", title: "Demande de mise à niveau de rôle ANIMATOR en attente", date: "Il y a 2 jours", author: "emma@ocp.ma", status: "Ouvert" },
    ]);
    const [auditLogs, setAuditLogs] = useState([
        { time: "01:12:35", event: "Connexion réussie", user: "admin@ocp.ma", ip: "192.168.1.50", type: "success" },
        { time: "01:08:44", event: "Création de la session ID #5", user: "animator@ocp.ma", ip: "192.168.1.55", type: "info" },
        { time: "00:54:12", event: "Accès 403 Forbidden sur /api/users", user: "user@ocp.ma", ip: "192.168.1.101", type: "warning" },
        { time: "Hier", event: "Nouvelle inscription de compte", user: "lucas@ocp.ma", ip: "192.168.1.102", type: "success" },
    ]);

    const scrollToSection = (sectionId: string) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

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
                    trend: "Taux d'adoption",
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
                ? usersData.map((user) => {
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
                sessionsCountVal: metricsData.sessionsCount ?? 0,
            });
        } catch {
            setState((current) => ({
                ...current,
                loading: false,
                errorMessage: "Impossible de charger les statistiques ou les utilisateurs depuis le backend.",
            }));
        }
    };

    useEffect(() => {
        void loadAdminDashboard();
    }, []);

    // Load active sessions from API when click on "Sessions actives" metric
    const fetchActiveSessions = async () => {
        setSessionsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/sessions`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch {
            // fallback
        } finally {
            setSessionsLoading(false);
        }
    };

    const handleRefresh = () => {
        setState((current) => ({ ...current, loading: true, errorMessage: "", actionMessage: "" }));
        void loadAdminDashboard();
    };

    // CSV Exporter
    const handleExportCSV = () => {
        const headers = "Nom,Email,Role,Statut,Derniere Activite\n";
        const rows = state.users.map((u: AdminTableUser) => `"${u.name}","${u.email}","${u.role}","${u.status}","${u.lastActive}"`).join("\n");
        const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `brainflow_users_report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setState((current) => ({
            ...current,
            actionMessage: "Rapport CSV exporté avec succès !"
        }));
        setTimeout(() => {
            setState((current) => ({ ...current, actionMessage: "" }));
        }, 4000);
    };

    // Toggle User Role
    const toggleUserRole = (email: string) => {
        const updatedUsers = state.users.map((user: AdminTableUser) => {
            if (user.email === email) {
                const newRole = user.role === "USER" ? "ANIMATOR" : user.role === "ANIMATOR" ? "ADMIN" : "USER";
                return { ...user, role: newRole as "USER" | "ANIMATOR" | "ADMIN" };
            }
            return user;
        });

        // Add audit log
        const user = state.users.find((u: AdminTableUser) => u.email === email);
        if (user) {
            setAuditLogs(prev => [
                {
                    time: "A l'instant",
                    event: `Rôle mis à jour (${user.role} → ${user.role === "USER" ? "ANIMATOR" : user.role === "ANIMATOR" ? "ADMIN" : "USER"})`,
                    user: user.email,
                    ip: "192.168.1.50",
                    type: "info"
                },
                ...prev
            ]);
        }

        setState((current) => ({
            ...current,
            users: updatedUsers,
            actionMessage: `Rôle de l'utilisateur ${email} mis à jour avec succès !`
        }));

        setTimeout(() => {
            setState((current) => ({ ...current, actionMessage: "" }));
        }, 4000);
    };

    // Suspend or Delete User locally
    const deleteUser = (email: string) => {
        const confirmDelete = window.confirm(`Voulez-vous vraiment suspendre l'accès de l'utilisateur ${email} ?`);
        if (!confirmDelete) return;

        const updatedUsers = state.users.filter((u: AdminTableUser) => u.email !== email);
        
        // Update metric
        const updatedMetrics = state.metrics.map((m: DashboardMetric) => {
            if (m.label === "Utilisateurs suivis") {
                return { ...m, value: String(parseInt(m.value) - 1) };
            }
            return m;
        });

        setAuditLogs(prev => [
            {
                time: "A l'instant",
                event: "Suspension temporaire de l'accès utilisateur",
                user: email,
                ip: "192.168.1.50",
                type: "warning"
            },
            ...prev
        ]);

        setState((current) => ({
            ...current,
            users: updatedUsers,
            metrics: updatedMetrics,
            actionMessage: `L'utilisateur ${email} a été suspendu avec succès.`
        }));

        setTimeout(() => {
            setState((current) => ({ ...current, actionMessage: "" }));
        }, 4000);
    };

    // Resolve an open issue
    const resolveIssue = (issueId: string) => {
        const updatedIssues = openIssues.filter((i: MockIssue) => i.id !== issueId);
        setOpenIssues(updatedIssues);

        // Update metric card count
        const updatedMetrics = state.metrics.map((m: DashboardMetric) => {
            if (m.label === "Signalements ouverts") {
                return { ...m, value: String(updatedIssues.length) };
            }
            return m;
        });

        setAuditLogs(prev => [
            {
                time: "A l'instant",
                event: `Signalement résolu : ${issueId}`,
                user: "admin@ocp.ma",
                ip: "192.168.1.50",
                type: "success"
            },
            ...prev
        ]);

        setState((current) => ({
            ...current,
            metrics: updatedMetrics,
            actionMessage: `Le signalement ${issueId} a été marqué comme résolu.`
        }));

        setTimeout(() => {
            setState((current) => ({ ...current, actionMessage: "" }));
        }, 4000);
    };

    const handleMetricClick = (metricLabel: string) => {
        if (metricLabel === "Utilisateurs suivis") {
            scrollToSection("users");
            return;
        }
        
        setSelectedMetric(metricLabel);
        if (metricLabel === "Sessions actives") {
            void fetchActiveSessions();
        }
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
                    <div className="rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-700 shadow-xs transition-all animate-fade-in">
                        <div className="flex items-center justify-between">
                            <p className="font-medium">✨ {state.actionMessage}</p>
                            <button 
                                type="button" 
                                onClick={() => setState((c: any) => ({ ...c, actionMessage: "" }))}
                                className="text-sky-500 hover:text-sky-700 font-bold"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ) : null}

                {/* Section Indicateurs */}
                <section className="rounded-[2rem] border border-white/50 bg-[#f3f0ea] p-6 shadow-neu-flat lg:p-8" id="overview">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sky-700/70 select-none">Vue d&apos;ensemble</p>
                            <h3 className="text-3xl font-bold text-[#1b202e] tracking-tight">Indicateurs de supervision</h3>
                            <p className="text-sm leading-6 text-slate-500">
                                Cliquez sur une carte ci-dessous pour ouvrir les détails de supervision ou exécuter des actions d&apos;audit rapide.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => scrollToSection("users")}
                                className="inline-flex items-center justify-center rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#dad7d1]/80 hover:shadow-neu-flat hover:text-sky-700 shadow-neu-flat-sm cursor-pointer"
                            >
                                Voir les utilisateurs
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAuditModalOpen(true)}
                                className="inline-flex items-center justify-center rounded-2xl bg-[#1b202e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#252c3f] shadow-neu-flat-sm cursor-pointer"
                            >
                                Ouvrir les journaux d'audit
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {state.loading ? initialMetrics.map((card: DashboardMetric) => (
                            <article key={card.label} className="rounded-3xl border border-[#dad7d1] bg-[#f3f0ea] p-5 shadow-neu-inset-sm">
                                <div className="h-4 w-28 rounded-full bg-[#dad7d1]/40" />
                                <div className="mt-6 flex items-end justify-between gap-4">
                                    <div className="h-9 w-16 rounded-full bg-[#dad7d1]/40" />
                                    <div className="h-8 w-24 rounded-full bg-[#dad7d1]/40" />
                                </div>
                            </article>
                        )) : state.metrics.map((card: DashboardMetric) => (
                            <article 
                                key={card.label} 
                                onClick={() => handleMetricClick(card.label)}
                                className={`rounded-3xl border p-5 transition hover:-translate-y-0.5 ${toneClasses[card.tone]}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm font-bold text-slate-500">{card.label}</p>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450">
                                        Cliquez ↗
                                    </span>
                                </div>
                                <div className="mt-6 flex items-end justify-between gap-4">
                                    <span className="text-4xl font-bold tracking-tight text-slate-900 select-none">{card.value}</span>
                                    <span className="text-xs font-semibold px-2 py-1 bg-[#f3f0ea] rounded-lg text-slate-650 border border-[#dad7d1] shadow-neu-flat-sm select-none">
                                        {card.trend}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Modale d'indicateur dynamique */}
                {selectedMetric ? (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
                        onClick={() => setSelectedMetric(null)}
                    >
                        <div 
                            className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto max-h-[85vh] md:p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                <div>
                                    <span className="text-xs uppercase tracking-widest text-sky-600 font-bold">Indicateurs</span>
                                    <h4 className="mt-1 text-2xl font-bold text-slate-900">{selectedMetric}</h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedMetric(null)}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                >
                                    Fermer
                                </button>
                            </div>

                            <div className="mt-6 space-y-4">
                                {selectedMetric === "Sessions actives" && (
                                    <>
                                        <p className="text-sm text-slate-600">Liste des ateliers actifs enregistrés sur le serveur. Cliquez sur un atelier pour rejoindre son tableau Miro.</p>
                                        {sessionsLoading ? (
                                            <p className="text-xs text-slate-400 italic">Chargement des sessions...</p>
                                        ) : sessions.length > 0 ? (
                                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                                {sessions.map((s) => (
                                                    <div 
                                                        key={s.id} 
                                                        onClick={() => {
                                                            setSelectedMetric(null);
                                                            router.push(`/board/${s.id}`);
                                                        }}
                                                        className="group cursor-pointer rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-white hover:border-sky-300 hover:shadow-xs flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <h5 className="text-sm font-bold text-slate-800 group-hover:text-sky-600">{s.title || "Session sans titre"}</h5>
                                                            <p className="text-xs text-slate-500 truncate max-w-[340px]">{s.description || "Pas de description"}</p>
                                                        </div>
                                                        <span className="text-xs font-semibold text-sky-600 group-hover:underline">Rejoindre le board →</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">Aucune session active disponible sur le serveur.</p>
                                        )}
                                    </>
                                )}

                                {selectedMetric === "Signalements ouverts" && (
                                    <>
                                        <p className="text-sm text-slate-600">Les signalements ci-dessous nécessitent une action administrative rapide.</p>
                                        <div className="space-y-2">
                                            {openIssues.map((issue) => (
                                                <div key={issue.id} className="rounded-xl border border-rose-100 bg-rose-50/20 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase tracking-wider">{issue.id}</span>
                                                        <h5 className="text-sm font-bold text-slate-800 mt-1">{issue.title}</h5>
                                                        <p className="text-xs text-slate-500 mt-0.5">Par : {issue.author} • {issue.date}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => resolveIssue(issue.id)}
                                                        className="rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 shadow-xs transition"
                                                    >
                                                        Résoudre
                                                    </button>
                                                </div>
                                            ))}
                                            {openIssues.length === 0 && (
                                                <div className="text-center py-8 bg-slate-50 rounded-xl">
                                                    <span className="text-2xl">🎉</span>
                                                    <p className="text-sm font-semibold text-slate-700 mt-2">Tous les signalements sont résolus !</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {selectedMetric === "Sessions validées" && (
                                    <div className="p-6 text-center space-y-4">
                                        <div className="relative mx-auto h-32 w-32 rounded-full border-8 border-emerald-500 border-t-slate-200 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-slate-800">75%</span>
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium">Taux de validation des ateliers de brainstorming</p>
                                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold mt-4">
                                            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100 text-emerald-700">
                                                <p className="text-lg">Completed</p>
                                                <p className="mt-1">75% des sessions</p>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-slate-600">
                                                <p className="text-lg">Active/Progress</p>
                                                <p className="mt-1">25% des sessions</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Section Table Utilisateurs */}
                <section id="users" className="grid gap-6 xl:grid-cols-[1.5fr_0.5fr]">
                    <article className="rounded-[2rem] border border-white/50 bg-[#f3f0ea] p-6 shadow-neu-flat overflow-hidden">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-700/70 select-none">Gestion des utilisateurs</p>
                                <h3 className="mt-2 text-2xl font-bold text-[#1b202e] tracking-tight">Accès et présence</h3>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">Mettez à jour le rôle ou suspendez un compte utilisateur.</p>
                        </div>

                        <div className="mt-6 overflow-x-auto rounded-3xl border border-[#dad7d1] bg-[#f3f0ea] shadow-neu-inset-sm">
                            <table className="min-w-full divide-y divide-[#dad7d1]/50 text-left">
                                <thead className="bg-[#f3f0ea] text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 border-b border-[#dad7d1]/50">
                                    <tr>
                                        <th className="px-5 py-4">Utilisateur</th>
                                        <th className="px-5 py-4">Rôle</th>
                                        <th className="px-5 py-4">Statut</th>
                                        <th className="px-5 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#dad7d1]/50 bg-[#f3f0ea] text-sm text-slate-700">
                                    {state.loading ? (
                                        <tr>
                                            <td className="px-5 py-6 text-slate-500" colSpan={4}>Chargement des utilisateurs...</td>
                                        </tr>
                                    ) : state.users.length > 0 ? (
                                        state.users.map((user: AdminTableUser) => (
                                            <tr key={user.email} className="transition hover:bg-[#dad7d1]/20">
                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-[#1b202e]">{user.name}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                        user.role === "ADMIN" ? "bg-rose-50 text-rose-700 border border-rose-100 shadow-sm" :
                                                        user.role === "ANIMATOR" ? "bg-sky-50 text-sky-700 border border-sky-100 shadow-sm" :
                                                        "bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm"
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-slate-600 font-bold">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => toggleUserRole(user.email)}
                                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-855 transition cursor-pointer"
                                                            title="Toggle User Role"
                                                        >
                                                            Rôle
                                                        </button>
                                                        {user.role !== "ADMIN" && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => deleteUser(user.email)}
                                                                className="text-xs font-bold text-rose-500 hover:text-rose-755 transition cursor-pointer"
                                                                title="Suspend User Access"
                                                            >
                                                                Suspendre
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
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

                    {/* Raccourcis Gouvernance */}
                    <aside className="space-y-6" id="governance">
                        <article className="rounded-[2rem] border border-white/50 bg-[#f3f0ea] p-6 shadow-neu-flat">
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sky-700/70 select-none">Gouvernance</p>
                            <h3 className="mt-3 text-xl font-bold text-[#1b202e]">Contrôles et alertes</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                Téléchargez les rapports globaux ou visualisez les événements de sécurité en temps réel.
                            </p>

                            <div className="mt-5 grid gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAuditModalOpen(true)} 
                                    className="rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-[#dad7d1]/80 hover:shadow-neu-flat hover:text-sky-700 shadow-neu-flat-sm cursor-pointer"
                                >
                                    Revoir les accès sensibles (Audit)
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleExportCSV}
                                    className="rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-[#dad7d1]/80 hover:shadow-neu-flat hover:text-sky-700 shadow-neu-flat-sm cursor-pointer"
                                >
                                    Exporter le rapport d&apos;activité (CSV)
                                </button>
                            </div>
                        </article>

                        <article id="configuration" className="rounded-[2rem] border border-white/50 bg-[#f3f0ea] p-6 shadow-neu-flat">
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-700/70 select-none">Configuration</p>
                            <h3 className="mt-3 text-xl font-bold text-[#1b202e]">Supervision plateforme</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                La base de données PostgreSQL 16 est connectée à l&apos;instance Spring Boot v4.1.0 exécutant le filtrage JWT.
                            </p>
                        </article>
                    </aside>
                </section>
            </div>

            {/* Audit Logs Modal */}
            {isAuditModalOpen ? (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
                    onClick={() => setIsAuditModalOpen(false)}
                >
                    <div 
                        className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto max-h-[85vh] md:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <span className="text-xs uppercase tracking-widest text-indigo-600 font-bold">Sécurité</span>
                                <h4 className="mt-1 text-2xl font-bold text-slate-900">Journaux d'Audit Récents</h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAuditModalOpen(false)}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                                Fermer
                            </button>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
                                <span>Événement & Utilisateur</span>
                                <span>Date/Heure & IP</span>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {auditLogs.map((log: any, index: number) => (
                                    <div 
                                        key={index}
                                        className={`rounded-xl border p-3.5 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50 ${
                                            log.type === "warning" ? "border-amber-150 text-amber-900" :
                                            log.type === "success" ? "border-emerald-150 text-emerald-900" :
                                            "border-slate-150 text-slate-800"
                                        }`}
                                    >
                                        <div>
                                            <p className="font-bold">{log.event}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Acteur : {log.user}</p>
                                        </div>
                                        <div className="text-right sm:text-right text-slate-500">
                                            <p className="font-semibold">{log.time}</p>
                                            <p className="text-[10px] mt-0.5">IP : {log.ip}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setAuditLogs([])}
                                    className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 font-semibold text-xs"
                                >
                                    Vider les journaux
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </DashboardShell>
    );
}
