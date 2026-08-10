"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { AuthenticatedUser, BrainstormingSessionApiResponse } from "@/types/user.types";

const API_BASE_URL = "http://localhost:8080";

type SessionsManagerProps = {
    currentUser?: AuthenticatedUser | null;
};

type SessionCard = {
    id: string;
    title: string;
    description: string;
    createdBy: string;
    createdAt: string;
    status: string;
};

const descriptionFallback = "Aucune description disponible pour cette session.";

function formatDate(value?: string) {
    if (!value) {
        return "Date non renseignée";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function getStatusStyles(status?: string) {
    const normalizedStatus = (status ?? "").toUpperCase();

    if (normalizedStatus === "ACTIVE") {
        return "border-sky-200 bg-sky-50 text-sky-700";
    }

    if (normalizedStatus === "IN_PROGRESS") {
        return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (normalizedStatus === "COMPLETED" || normalizedStatus === "VALIDATED") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-600";
}

function truncateDescription(description: string) {
    if (description.length <= 140) {
        return description;
    }

    return `${description.slice(0, 140).trimEnd()}...`;
}

export function SessionsManager({ currentUser }: SessionsManagerProps) {
    const router = useRouter();
    const [sessions, setSessions] = useState<SessionCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Module 2 Filter & Details
    const [selectedSession, setSelectedSession] = useState<SessionCard | null>(null);
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "IN_PROGRESS" | "COMPLETED">("ALL");

    // Module 3 Real-time Collaboration Prep
    const [collaborativeIdeas, setCollaborativeIdeas] = useState<string[]>([]);
    const [newIdeaText, setNewIdeaText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const canCreate = currentUser?.systemRole === "ANIMATOR";
    const userEmail = currentUser?.email ?? "Utilisateur connecté";

    const loadSessions = async (showRefreshingState = false) => {
        await Promise.resolve();

        const token = localStorage.getItem("token");

        if (!token) {
            setSessions([]);
            setErrorMessage("Session introuvable. Veuillez vous reconnecter.");
            setLoading(false);
            setRefreshing(false);
            return;
        }

        if (showRefreshingState) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setErrorMessage("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/sessions`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Unable to fetch sessions");
            }

            const payload: unknown = await response.json();

            const nextSessions: SessionCard[] = Array.isArray(payload)
                ? payload.map((item, index) => {
                    const session = item as BrainstormingSessionApiResponse;
                    const rawDescription = typeof session.description === "string" ? session.description : descriptionFallback;

                    return {
                        id: String(session.id ?? index),
                        title: typeof session.title === "string" && session.title.trim().length > 0 ? session.title : "Session sans titre",
                        description: rawDescription,
                        createdBy: typeof session.createdBy === "string" && session.createdBy.trim().length > 0 ? session.createdBy : "Utilisateur BrainFlow",
                        createdAt: formatDate(typeof session.createdAt === "string" ? session.createdAt : undefined),
                        status: typeof session.status === "string" ? session.status : "ACTIVE",
                    };
                })
                : [];

            setSessions(nextSessions);
        } catch {
            setSessions([]);
            setErrorMessage("Impossible de charger les sessions de brainstorming depuis le backend.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadSessions();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        if (selectedSession) {
            const saved = localStorage.getItem(`ideas-${selectedSession.id}`);
            if (saved) {
                setCollaborativeIdeas(JSON.parse(saved));
            } else {
                setCollaborativeIdeas([
                    "Optimiser l'UX du tableau de bord",
                    "Migrer vers Spring Boot 4.1.0 et Java 24",
                    "Intégrer les WebSockets pour la collaboration"
                ]);
            }
        }
    }, [selectedSession]);

    const addIdea = (text: string) => {
        if (!text.trim() || !selectedSession) return;
        const updated = [...collaborativeIdeas, text.trim()];
        setCollaborativeIdeas(updated);
        localStorage.setItem(`ideas-${selectedSession.id}`, JSON.stringify(updated));
        setNewIdeaText("");
    };

    const handleCreateSession = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const token = localStorage.getItem("token");

        if (!token) {
            setErrorMessage("Session introuvable. Veuillez vous reconnecter.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/sessions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    description,
                }),
            });

            if (!response.ok) {
                throw new Error("Unable to create session");
            }

            setTitle("");
            setDescription("");
            setIsModalOpen(false);
            await loadSessions(true);
        } catch {
            setErrorMessage("La création a échoué. Vérifiez la connexion au backend ou l'endpoint /api/sessions.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        const token = localStorage.getItem("token");

        if (!token) {
            setErrorMessage("Session introuvable. Veuillez vous reconnecter.");
            return;
        }

        const shouldDelete = window.confirm("Supprimer définitivement cette session ?");

        if (!shouldDelete) {
            return;
        }

        setErrorMessage("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/sessions/${encodeURIComponent(sessionId)}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Unable to delete session");
            }

            await loadSessions(true);
        } catch {
            setErrorMessage("La suppression a échoué. Vérifiez l'endpoint DELETE /api/sessions/{id}.");
        }
    };

    const visibleSessions = useMemo(() => {
        return sessions.filter((s) => {
            const matchesStatus = statusFilter === "ALL" || s.status.toUpperCase() === statusFilter;
            const matchesSearch = !searchQuery.trim() ||
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.createdBy.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [sessions, statusFilter, searchQuery]);

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
                <div className="max-w-2xl space-y-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-sky-700/70">
                        {canCreate ? "Module 2" : "Espace Collaboratif"}
                    </p>
                    <h3 className="text-3xl font-semibold text-slate-900">
                        {canCreate ? "Gestion des sessions de brainstorming" : "Mes Sessions"}
                    </h3>
                    <p className="text-sm leading-6 text-slate-600">
                        {canCreate
                            ? `${userEmail} peut consulter, créer et rafraîchir les sessions de brainstorming en temps réel.`
                            : `${userEmail} peut consulter, rechercher et rejoindre les ateliers de brainstorming.`}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher une session..."
                            className="w-full sm:w-64 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                                aria-label="Effacer la recherche"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {canCreate ? (
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                        >
                            + Nouvelle session
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Barre de filtres de statut */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {(["ALL", "ACTIVE", "IN_PROGRESS", "COMPLETED"] as const).map((filter) => {
                        const count = sessions.filter(s => filter === "ALL" ? true : s.status.toUpperCase() === filter).length;
                        const label = filter === "ALL" ? "Tous" : filter === "ACTIVE" ? "Actives" : filter === "IN_PROGRESS" ? "En cours" : "Terminées";
                        const isActive = statusFilter === filter;
                        return (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setStatusFilter(filter)}
                                className={`relative rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                                    isActive
                                        ? "bg-slate-950 text-white shadow-sm"
                                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {filter !== "ALL" && (
                                        <span className={`h-2.5 w-2.5 rounded-full ${
                                            filter === "ACTIVE" ? "bg-sky-500" : filter === "IN_PROGRESS" ? "bg-amber-500" : "bg-emerald-500"
                                        }`} />
                                    )}
                                    {label}
                                    <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                                        isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                                    }`}>
                                        {count}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                    Affiche {visibleSessions.length} session{visibleSessions.length > 1 ? "s" : ""}
                </div>
            </div>

            {errorMessage ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p>{errorMessage}</p>
                        <button
                            type="button"
                            onClick={() => loadSessions(true)}
                            className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-700"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {loading || refreshing ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <article key={index} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="h-3 w-16 rounded bg-slate-100" />
                                    <div className="h-5 w-32 rounded bg-slate-100" />
                                </div>
                                <div className="h-6 w-16 rounded-full bg-slate-100" />
                            </div>
                            <div className="mt-3 space-y-2">
                                <div className="h-3 w-full rounded bg-slate-100" />
                                <div className="h-3 w-5/6 rounded bg-slate-100" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between gap-2">
                                <div className="h-3 w-20 rounded bg-slate-100" />
                                <div className="h-3 w-20 rounded bg-slate-100" />
                            </div>
                        </article>
                    ))
                ) : visibleSessions.length > 0 ? (
                    visibleSessions.map((session) => (
                        <article 
                            key={session.id} 
                            onClick={() => setSelectedSession(session)}
                            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Session</span>
                                    <h4 className="text-sm font-semibold text-slate-800 transition group-hover:text-sky-700">{session.title}</h4>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusStyles(session.status)}`}>
                                        {session.status}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSession(session.id);
                                        }}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-600"
                                        aria-label={`Supprimer la session ${session.title}`}
                                        title="Supprimer la session"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>

                            <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-3">
                                {truncateDescription(session.description)}
                            </p>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                <div className="flex items-center gap-1">
                                    <span>👤</span>
                                    <span className="truncate max-w-[120px] font-medium text-slate-600">{session.createdBy.split('@')[0]}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span>📅</span>
                                    <span className="font-medium text-slate-600">{session.createdAt}</span>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/board/${session.id}`);
                                    }}
                                    className="font-semibold text-sky-600 hover:text-sky-700 transition flex items-center gap-1"
                                >
                                    Ouvrir la session →
                                </button>
                                <span className="text-[10px] uppercase tracking-wider text-slate-300">BrainFlow</span>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">
                        Aucune session n&apos;est disponible pour le moment.
                    </div>
                )}
            </div>

            {canCreate && isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.4em] text-sky-700/70">Nouvelle session</p>
                                <h4 className="mt-2 text-2xl font-semibold text-slate-900">Créer une session de brainstorming</h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                aria-label="Fermer la modale"
                            >
                                ✕
                            </button>
                        </div>

                        <form className="mt-6 space-y-5" onSubmit={handleCreateSession}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700" htmlFor="title">
                                    Titre
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                                    placeholder="Ex. Session stratégie produit"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700" htmlFor="description">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={5}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                                    placeholder="Décrivez brièvement l'objectif de la session..."
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isSubmitting ? "Création en cours..." : "Créer la session"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {selectedSession ? (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
                    onClick={() => setSelectedSession(null)}
                >
                    <div 
                        className="w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh] md:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <p className="text-xs uppercase tracking-[0.4em] text-sky-700/70">Atelier de brainstorming</p>
                                <h4 className="mt-2 text-2xl font-semibold text-slate-900">{selectedSession.title}</h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedSession(null)}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                aria-label="Fermer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Two Columns Grid */}
                        <div className="mt-6 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                            {/* Left Column: Details */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Objectif & Description</h5>
                                    <p className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line">
                                        {selectedSession.description}
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-sm">
                                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Créateur</p>
                                        <p className="mt-2 font-medium text-slate-800">{selectedSession.createdBy}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-sm">
                                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Créée le</p>
                                        <p className="mt-2 font-medium text-slate-800">{selectedSession.createdAt}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                    <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Statut de la session</span>
                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(selectedSession.status)}`}>
                                        {selectedSession.status}
                                    </span>
                                </div>
                            </div>

                            {/* Right Column: WebSocket Collaboration Prep */}
                            <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/20 p-5 shadow-sm space-y-5">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-xs font-semibold uppercase tracking-wider text-sky-800/80">
                                            Espace Collaboratif
                                        </h5>
                                        <span className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            Module 3 (WebSocket ready)
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-normal">
                                        Les idées ci-dessous seront partagées en temps réel via WebSockets & STOMP dès le Module 3.
                                    </p>
                                </div>

                                {/* Simulated Connection Info */}
                                <div className="rounded-xl border border-slate-100 bg-white p-3 text-xs flex items-center justify-between">
                                    <span className="font-medium text-slate-600">Statut de connexion</span>
                                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                                        <span className="h-2 w-2 rounded-full bg-slate-300" />
                                        Mode Local
                                    </span>
                                </div>

                                {/* Simulated Active Collaborators */}
                                <div className="space-y-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Collaborateurs actifs (3)
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-[10px] font-bold text-white" title="Emma">EM</div>
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-500 text-[10px] font-bold text-white" title="Lucas">LU</div>
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[10px] font-bold text-white" title="Sofia">SO</div>
                                        </div>
                                        <span className="text-[10px] text-slate-500 italic animate-pulse">
                                            Emma est en train de réfléchir...
                                        </span>
                                    </div>
                                </div>

                                {/* List of Collaborative Ideas */}
                                <div className="space-y-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Idées générées ({collaborativeIdeas.length})
                                    </p>
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                        {collaborativeIdeas.map((idea, idx) => (
                                            <div 
                                                key={idx} 
                                                className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3 text-xs shadow-sm transition hover:border-sky-100 hover:shadow-md"
                                            >
                                                <span className="text-slate-700 leading-normal">{idea}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = collaborativeIdeas.filter((_, i) => i !== idx);
                                                        setCollaborativeIdeas(updated);
                                                        localStorage.setItem(`ideas-${selectedSession.id}`, JSON.stringify(updated));
                                                    }}
                                                    className="text-slate-300 hover:text-rose-500 transition-colors"
                                                    title="Supprimer cette idée"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        {collaborativeIdeas.length === 0 && (
                                            <p className="text-xs text-slate-400 italic text-center py-4">
                                                Aucune idée pour le moment. Soyez le premier à contribuer !
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Add Idea Input */}
                                <form 
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        addIdea(newIdeaText);
                                    }} 
                                    className="flex gap-2"
                                >
                                    <input
                                        type="text"
                                        value={newIdeaText}
                                        onChange={(e) => setNewIdeaText(e.target.value)}
                                        placeholder="Une idée géniale..."
                                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
                                    />
                                    <button
                                        type="submit"
                                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                                    >
                                        Ajouter
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
                            <button
                                type="button"
                                onClick={() => setSelectedSession(null)}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                Fermer
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push(`/board/${selectedSession.id}`)}
                                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-sky-700 hover:to-indigo-600"
                            >
                                Rejoindre l&apos;atelier direct
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}