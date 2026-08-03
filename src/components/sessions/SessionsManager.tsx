"use client";

import { useEffect, useMemo, useState } from "react";

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
    const [sessions, setSessions] = useState<SessionCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

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

    const visibleSessions = useMemo(() => sessions, [sessions]);

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between lg:p-8">
                <div className="max-w-3xl space-y-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-sky-700/70">Module 2</p>
                    <h3 className="text-3xl font-semibold text-slate-900">Gestion des sessions de brainstorming</h3>
                    <p className="text-sm leading-6 text-slate-600">
                        {userEmail} peut consulter, créer et rafraîchir les sessions de brainstorming en temps réel.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                    + Nouvelle session
                </button>
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
                        <article key={index} className="animate-pulse rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="h-3 w-24 rounded-full bg-slate-100" />
                                    <div className="h-6 w-44 rounded-full bg-slate-100" />
                                </div>
                                <div className="h-8 w-20 rounded-full bg-slate-100" />
                            </div>
                            <div className="mt-5 space-y-3">
                                <div className="h-4 w-full rounded-full bg-slate-100" />
                                <div className="h-4 w-5/6 rounded-full bg-slate-100" />
                                <div className="h-4 w-3/4 rounded-full bg-slate-100" />
                            </div>
                            <div className="mt-6 flex gap-3">
                                <div className="h-10 flex-1 rounded-2xl bg-slate-100" />
                                <div className="h-10 w-24 rounded-2xl bg-slate-100" />
                            </div>
                        </article>
                    ))
                ) : visibleSessions.length > 0 ? (
                    visibleSessions.map((session) => (
                        <article key={session.id} className="group rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Session</p>
                                    <h4 className="text-lg font-semibold text-slate-900">{session.title}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyles(session.status)}`}>
                                        {session.status}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSession(session.id)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                                        aria-label={`Supprimer la session ${session.title}`}
                                        title="Supprimer la session"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>

                            <p className="mt-4 text-sm leading-6 text-slate-600">
                                {truncateDescription(session.description)}
                            </p>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Auteur</p>
                                    <p className="mt-2 font-medium text-slate-900">{session.createdBy}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Créée le</p>
                                    <p className="mt-2 font-medium text-slate-900">{session.createdAt}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-3">
                                <button type="button" className="text-sm font-semibold text-sky-700 transition hover:text-sky-800">
                                    Ouvrir la session
                                </button>
                                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">BrainFlow</span>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm sm:col-span-2 xl:col-span-3">
                        Aucune session n&apos;est disponible pour le moment.
                    </div>
                )}
            </div>

            {isModalOpen ? (
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
        </section>
    );
}