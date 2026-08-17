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
    inviteToken?: string;
};

type IntroductionSlide = {
    id?: number;
    sessionId?: number;
    title: string;
    content: string;
    slideOrder: number;
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
    const [allowGuestVoting, setAllowGuestVoting] = useState(true);

    // Presentation Slides states
    const [isSlidesModalOpen, setIsSlidesModalOpen] = useState(false);
    const [editingSessionForSlides, setEditingSessionForSlides] = useState<SessionCard | null>(null);
    const [slides, setSlides] = useState<IntroductionSlide[]>([]);
    const [loadingSlides, setLoadingSlides] = useState(false);
    const [savingSlides, setSavingSlides] = useState(false);

    // Module 2 Filter & Details
    const [selectedSession, setSelectedSession] = useState<SessionCard | null>(null);
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACTIVE" | "IN_PROGRESS" | "COMPLETED">("ALL");
    const [isCopied, setIsCopied] = useState(false);

    const handleCloseDetails = () => {
        setSelectedSession(null);
        setIsCopied(false);
    };

    const handleCopyLink = (link: string) => {
        void navigator.clipboard.writeText(link)
            .then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            })
            .catch((err) => {
                console.error("Failed to copy link: ", err);
            });
    };

    // Module 3 Real-time Collaboration Prep
    const [collaborativeIdeas, setCollaborativeIdeas] = useState<string[]>([]);
    const [activeCollaborators, setActiveCollaborators] = useState<string[]>([]);
    const [newIdeaText, setNewIdeaText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [waitingParticipants, setWaitingParticipants] = useState<{ userId: number; email: string; username: string }[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    const loadWaitingParticipants = async (sessionId: string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setLoadingParticipants(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/participants`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setWaitingParticipants(data);
            }
        } catch (err) {
            console.error("Failed to load waiting participants", err);
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleApproveParticipant = async (userId: number) => {
        if (!selectedSession) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/sessions/${selectedSession.id}/participants/${userId}/approve`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                void loadWaitingParticipants(selectedSession.id);
            } else {
                setErrorMessage("Impossible d'admettre le participant.");
            }
        } catch (err) {
            console.error("Error approving participant", err);
            setErrorMessage("Erreur lors de l'approbation du participant.");
        }
    };

    useEffect(() => {
        if (selectedSession) {
            void loadWaitingParticipants(selectedSession.id);
        } else {
            setWaitingParticipants([]);
        }
    }, [selectedSession]);

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
                        createdBy: typeof session.creatorEmail === "string" && session.creatorEmail.trim().length > 0
                            ? session.creatorEmail
                            : (session.createdByUserId ? `Utilisateur #${session.createdByUserId}` : "Utilisateur BrainFlow"),
                        createdAt: formatDate(typeof session.createdAt === "string" ? session.createdAt : undefined),
                        status: typeof session.status === "string" ? session.status : "ACTIVE",
                        inviteToken: typeof session.inviteToken === "string" ? session.inviteToken : "",
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
                setCollaborativeIdeas([]);
            }

            if (currentUser) {
                const name = currentUser.username || currentUser.email?.split("@")[0] || "Moi";
                setActiveCollaborators([name]);
            } else {
                setActiveCollaborators([]);
            }
        }
    }, [selectedSession, currentUser]);

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
                    allowGuestVoting,
                }),
            });

            if (!response.ok) {
                throw new Error("Unable to create session");
            }

            setTitle("");
            setAllowGuestVoting(true);
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

    const handleStartSession = async (sessionId: string) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setErrorMessage("Session introuvable. Veuillez vous reconnecter.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: "IN_PROGRESS" }),
            });

            if (!response.ok) {
                throw new Error("Unable to start session");
            }

            router.push(`/board/${sessionId}`);
        } catch {
            setErrorMessage("Impossible de démarrer la session.");
        }
    };

    const handleOpenSlidesModal = async (session: SessionCard) => {
        setEditingSessionForSlides(session);
        setIsSlidesModalOpen(true);
        setSlides([]);
        setLoadingSlides(true);
        
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/sessions/${session.id}/slides`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSlides(data);
            }
        } catch (err) {
            console.error("Error fetching slides:", err);
        } finally {
            setLoadingSlides(false);
        }
    };

    const handleSaveSlides = async () => {
        if (!editingSessionForSlides) return;
        setSavingSlides(true);

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/sessions/${editingSessionForSlides.id}/slides`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(slides)
            });
            if (res.ok) {
                setIsSlidesModalOpen(false);
                setEditingSessionForSlides(null);
            } else {
                alert("Erreur lors de la sauvegarde des slides.");
            }
        } catch (err) {
            console.error("Error saving slides:", err);
            alert("Erreur de connexion.");
        } finally {
            setSavingSlides(false);
        }
    };

    const handleAddSlide = () => {
        setSlides(prev => [
            ...prev,
            {
                title: `Slide ${prev.length + 1}`,
                content: "",
                slideOrder: prev.length + 1
            }
        ]);
    };

    const handleUpdateSlide = (index: number, field: "title" | "content", value: string) => {
        setSlides(prev => {
            const copy = [...prev];
            copy[index] = {
                ...copy[index],
                [field]: value
            };
            return copy;
        });
    };

    const handleDeleteSlide = (index: number) => {
        setSlides(prev => {
            const filtered = prev.filter((_, i) => i !== index);
            return filtered.map((slide, i) => ({
                ...slide,
                slideOrder: i + 1
            }));
        });
    };

    const handleMoveSlideUp = (index: number) => {
        if (index === 0) return;
        setSlides(prev => {
            const copy = [...prev];
            const temp = copy[index];
            copy[index] = copy[index - 1];
            copy[index - 1] = temp;
            return copy.map((slide, i) => ({
                ...slide,
                slideOrder: i + 1
            }));
        });
    };

    const handleMoveSlideDown = (index: number) => {
        setSlides(prev => {
            if (index === prev.length - 1) return prev;
            const copy = [...prev];
            const temp = copy[index];
            copy[index] = copy[index + 1];
            copy[index + 1] = temp;
            return copy.map((slide, i) => ({
                ...slide,
                slideOrder: i + 1
            }));
        });
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
            <div className="flex flex-col gap-4 rounded-[2rem] border border-white/50 bg-[#f3f0ea] p-6 shadow-neu-flat lg:flex-row lg:items-center lg:justify-between lg:p-8">
                <div className="max-w-2xl space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">
                        {canCreate ? "Module 2" : "Espace Collaboratif"}
                    </p>
                    <h3 className="text-3xl font-bold text-[#1b202e] tracking-tight">
                        {canCreate ? "Gestion des sessions de brainstorming" : "Mes Sessions"}
                    </h3>
                    <p className="text-sm leading-6 text-slate-500">
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
                            className="w-full sm:w-64 rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-4 py-3 text-sm text-[#1a1f2c] outline-none transition placeholder:text-slate-450 focus:border-[#dad7d1]/80 shadow-neu-inset-sm focus:shadow-neu-inset"
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
                            className="inline-flex items-center justify-center rounded-2xl bg-[#1b202e] px-5 py-3 text-sm font-semibold text-white shadow-neu-flat-sm transition hover:bg-[#252c3f] hover:shadow-neu-flat active:scale-[0.98] cursor-pointer"
                        >
                            + Nouvelle session
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Barre de filtres de statut */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#dad7d1] bg-[#f3f0ea] p-4 shadow-neu-flat-sm">
                <div className="flex flex-wrap gap-2">
                    {(["ALL", "PENDING", "ACTIVE", "IN_PROGRESS", "COMPLETED"] as const).map((filter) => {
                        const count = sessions.filter(s => filter === "ALL" ? true : s.status.toUpperCase() === filter).length;
                        const label = filter === "ALL" ? "Tous" : filter === "PENDING" ? "En attente" : filter === "ACTIVE" ? "Actives" : filter === "IN_PROGRESS" ? "En cours" : "Terminées";
                        const isActive = statusFilter === filter;
                        return (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setStatusFilter(filter)}
                                className={`relative rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                    isActive
                                        ? "bg-[#1b202e] text-white shadow-neu-flat-sm"
                                        : "bg-[#f3f0ea] text-slate-600 border border-[#dad7d1] hover:bg-[#f3f0ea]/80 hover:text-slate-900 shadow-neu-flat-sm"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {filter !== "ALL" && (
                                        <span className={`h-2.5 w-2.5 rounded-full ${
                                            filter === "PENDING" ? "bg-slate-400" : filter === "ACTIVE" ? "bg-sky-500" : filter === "IN_PROGRESS" ? "bg-amber-500" : "bg-emerald-500"
                                        }`} />
                                    )}
                                    {label}
                                    <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                                        isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                    }`}>
                                        {count}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
                <div className="text-xs text-slate-500 font-medium select-none">
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
                        <article key={index} className="animate-pulse rounded-xl border border-[#dad7d1] bg-[#f3f0ea]/60 p-4 shadow-neu-inset-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="h-3 w-16 rounded bg-slate-200/50" />
                                    <div className="h-5 w-32 rounded bg-slate-200/50" />
                                </div>
                                <div className="h-6 w-16 rounded-full bg-slate-200/50" />
                            </div>
                            <div className="mt-3 space-y-2">
                                <div className="h-3 w-full rounded bg-slate-200/50" />
                                <div className="h-3 w-5/6 rounded bg-slate-200/50" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-[#dad7d1]/50 flex justify-between gap-2">
                                <div className="h-3 w-20 rounded bg-slate-200/50" />
                                <div className="h-3 w-20 rounded bg-slate-200/50" />
                            </div>
                        </article>
                    ))
                ) : visibleSessions.length > 0 ? (
                    visibleSessions.map((session) => (
                        <article 
                            key={session.id} 
                            onClick={() => setSelectedSession(session)}
                            className="group cursor-pointer rounded-xl border border-[#dad7d1] bg-[#f3f0ea] p-4 shadow-neu-flat-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#dad7d1]/80 hover:shadow-neu-flat"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Session</span>
                                    <h4 className="text-sm font-semibold text-slate-850 transition group-hover:text-sky-700">{session.title}</h4>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${getStatusStyles(session.status)}`}>
                                        {session.status}
                                    </span>
                                    {canCreate && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                void handleOpenSlidesModal(session);
                                            }}
                                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#dad7d1] bg-[#f3f0ea] text-slate-450 transition hover:border-sky-350 hover:bg-sky-50 hover:text-sky-600 shadow-neu-flat-sm cursor-pointer"
                                            title="Configurer la présentation"
                                        >
                                            📽️
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSession(session.id);
                                        }}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#dad7d1] bg-[#f3f0ea] text-slate-450 transition hover:border-rose-350 hover:bg-rose-50 hover:text-rose-600 shadow-neu-flat-sm cursor-pointer"
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

                            <div className="mt-4 pt-3 border-t border-[#dad7d1]/50 flex items-center justify-between text-[11px] text-slate-450">
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
                                    className="font-bold text-sky-600 hover:text-sky-700 transition flex items-center gap-1 cursor-pointer"
                                >
                                    Ouvrir la session →
                                </button>
                                <span className="text-[10px] uppercase tracking-wider text-slate-350 select-none">BrainFlow</span>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="rounded-xl border border-dashed border-[#dad7d1] bg-[#f3f0ea] p-6 text-sm text-slate-500 shadow-neu-inset-sm sm:col-span-2 xl:col-span-3">
                        Aucune session n&apos;est disponible pour le moment.
                    </div>
                )}
            </div>

            {canCreate && isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[2rem] border border-white/50 bg-[#f3f0ea] p-6 shadow-2xl shadow-[#12151e]/20">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Nouvelle session</p>
                                <h4 className="mt-2 text-2xl font-bold text-[#1b202e] tracking-tight">Créer une session de brainstorming</h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-3 py-2 text-sm font-semibold text-slate-600 shadow-neu-flat-sm transition hover:border-[#dad7d1]/80 hover:shadow-neu-flat hover:text-sky-700 cursor-pointer"
                                aria-label="Fermer la modale"
                            >
                                ✕
                            </button>
                        </div>

                        <form className="mt-6 space-y-5" onSubmit={handleCreateSession}>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700" htmlFor="title">
                                    Titre
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    className="w-full rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#dad7d1]/80 focus:shadow-neu-inset shadow-neu-inset-sm"
                                    placeholder="Ex. Session stratégie produit"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input
                                    id="allowGuestVoting"
                                    name="allowGuestVoting"
                                    type="checkbox"
                                    checked={allowGuestVoting}
                                    onChange={(event) => setAllowGuestVoting(event.target.checked)}
                                    className="h-5 w-5 rounded-lg border-[#dad7d1] text-sky-600 focus:ring-sky-500 cursor-pointer bg-[#f3f0ea] shadow-neu-flat-sm"
                                />
                                <label className="text-sm font-semibold text-slate-700 select-none cursor-pointer" htmlFor="allowGuestVoting">
                                    Autoriser le vote des invités
                                </label>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="inline-flex items-center justify-center rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-4 py-3 text-sm font-semibold text-slate-700 shadow-neu-flat-sm transition hover:bg-[#f3f0ea]/80 hover:shadow-neu-flat cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center rounded-2xl bg-[#1b202e] px-4 py-3 text-sm font-semibold text-white shadow-neu-flat-sm transition hover:bg-[#252c3f] hover:shadow-neu-flat disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                                >
                                    {isSubmitting ? "Création en cours..." : "Créer la session"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {selectedSession ? (() => {
                const isCompleted = selectedSession.status.toUpperCase() === "COMPLETED";
                return (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm"
                        onClick={handleCloseDetails}
                    >
                        <div 
                            className="w-full max-w-4xl rounded-[2rem] border border-white/50 bg-[#f3f0ea] p-6 shadow-2xl shadow-[#12151e]/20 overflow-y-auto max-h-[90vh] md:p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-[#dad7d1]/50 pb-5">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Atelier de brainstorming</p>
                                    <h4 className="mt-2 text-2xl font-bold text-[#1b202e] tracking-tight">{selectedSession.title}</h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseDetails}
                                    className="rounded-xl border border-[#dad7d1] bg-[#f3f0ea] px-3 py-2 text-sm font-semibold text-slate-600 shadow-neu-flat-sm transition hover:border-[#dad7d1]/80 hover:shadow-neu-flat hover:text-slate-950 cursor-pointer"
                                    aria-label="Fermer"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Metadata row */}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[#dad7d1]/55 py-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5 font-medium">
                                    <span className="text-slate-400">👤 Créateur :</span>
                                    <span className="font-semibold text-slate-700">{selectedSession.createdBy}</span>
                                </span>
                                <span className="h-3 w-px bg-slate-300 hidden sm:inline" />
                                <span className="flex items-center gap-1.5 font-medium">
                                    <span className="text-slate-400">📅 Créée le :</span>
                                    <span className="font-semibold text-slate-700">{selectedSession.createdAt}</span>
                                </span>
                                <span className="h-3 w-px bg-slate-300 hidden sm:inline" />
                                <span className="flex items-center gap-1.5 font-medium">
                                    <span className="text-slate-400">Statut :</span>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border shadow-sm ${getStatusStyles(selectedSession.status)}`}>
                                        {selectedSession.status}
                                    </span>
                                </span>
                            </div>

                            {/* Invitation Link Copy Section */}
                            {selectedSession.inviteToken && (
                                <div className="mt-4 rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] p-4 text-xs shadow-neu-inset-sm">
                                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2">
                                        Lien d'invitation participant
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={`${typeof window !== "undefined" ? window.location.origin : ""}/session/${selectedSession.inviteToken}`}
                                            className="flex-1 rounded-xl border border-[#dad7d1] bg-[#f3f0ea] px-3 py-2 text-slate-650 outline-none select-all shadow-neu-inset-sm font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleCopyLink(`${window.location.origin}/session/${selectedSession.inviteToken}`)}
                                            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-white transition active:scale-[0.98] cursor-pointer ${
                                                isCopied ? "bg-emerald-600 shadow-neu-flat-sm hover:bg-emerald-700" : "bg-[#1b202e] shadow-neu-flat-sm hover:bg-[#252c3f]"
                                            }`}
                                        >
                                            {isCopied ? "Copié ! ✅" : "Copier"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Participants en attente d'approbation */}
                            <div className="mt-4 rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] p-4 text-xs shadow-neu-inset-sm">
                                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-3">
                                    Participants en attente d&apos;approbation
                                </p>
                                {loadingParticipants ? (
                                    <div className="animate-pulse text-slate-450 font-medium py-1">Chargement des participants en attente...</div>
                                ) : waitingParticipants.length > 0 ? (
                                    <div className="space-y-2">
                                        {waitingParticipants.map((p) => (
                                            <div key={p.userId} className="flex items-center justify-between bg-[#f3f0ea] rounded-xl border border-[#dad7d1] p-3 shadow-neu-flat-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-800">{p.username}</span>
                                                    <span className="text-slate-500 text-[10px]">{p.email}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleApproveParticipant(p.userId)}
                                                    className="rounded-lg bg-[#1b202e] hover:bg-[#252c3f] text-white font-bold px-3 py-1.5 transition text-[11px] cursor-pointer shadow-neu-flat-sm"
                                                >
                                                    Admettre
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-450 font-medium py-1">Aucun participant en attente pour le moment.</p>
                                )}
                            </div>

                            {/* Conditionally show description block */}
                            {selectedSession.description && selectedSession.description !== descriptionFallback && (
                                <div className="mt-5 rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] p-4 text-xs leading-relaxed text-slate-650 shadow-neu-inset-sm font-medium">
                                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Objectif & Description</p>
                                    <p className="whitespace-pre-line">{selectedSession.description}</p>
                                </div>
                            )}

                            {/* Espace Collaboratif Workspace */}
                            <div className="mt-6 rounded-3xl border border-[#dad7d1] bg-[#f3f0ea] p-6 shadow-neu-inset-sm space-y-6">
                                {/* Workspace Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#dad7d1]/50 pb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h5 className="text-sm font-bold uppercase tracking-wider text-slate-700 select-none">
                                                Espace Collaboratif
                                            </h5>
                                            <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-semibold text-amber-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                Collaboration en direct
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Partagez des idées en temps réel avec vos collaborateurs.
                                        </p>
                                    </div>

                                    {/* Active Collaborators dynamic component */}
                                    {activeCollaborators.length > 0 && (
                                        <div className="flex items-center gap-3 select-none">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Actifs ({activeCollaborators.length})
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex -space-x-1.5">
                                                    {activeCollaborators.map((user, idx) => {
                                                        const initials = user.slice(0, 2).toUpperCase();
                                                        return (
                                                            <div 
                                                                key={idx} 
                                                                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#1b202e] text-[10px] font-bold text-white shadow-neu-flat-sm" 
                                                                title={user}
                                                            >
                                                                {initials}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* List / Grid of Collaborative Ideas */}
                                <div className="space-y-3">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-450 select-none">
                                        Idées générées ({collaborativeIdeas.length})
                                    </p>
                                    
                                    {collaborativeIdeas.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto pr-1">
                                            {collaborativeIdeas.map((idea, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className="group relative flex flex-col justify-between rounded-xl border border-[#dad7d1] bg-[#f3f0ea] p-4 text-xs shadow-neu-flat-sm transition hover:border-[#dad7d1]/80 hover:shadow-neu-flat min-h-[90px]"
                                                >
                                                    <span className="text-slate-800 font-bold leading-relaxed">{idea}</span>
                                                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-[#dad7d1]/30">
                                                        <span className="select-none">Idée #{idx + 1}</span>
                                                        {!isCompleted && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updated = collaborativeIdeas.filter((_, i) => i !== idx);
                                                                    setCollaborativeIdeas(updated);
                                                                    localStorage.setItem(`ideas-${selectedSession.id}`, JSON.stringify(updated));
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition font-bold cursor-pointer"
                                                                title="Supprimer cette idée"
                                                            >
                                                                Supprimer
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dad7d1] bg-[#f3f0ea] p-10 text-center shadow-neu-inset-sm select-none">
                                            <span className="text-2xl mb-2">💡</span>
                                            <p className="text-xs font-semibold text-slate-500">
                                                Aucune idée pour le moment. Lancez le brainstorming !
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Lock Warning Banner & Form Container */}
                                <div className="space-y-3 pt-2">
                                    {isCompleted && (
                                        <div className="flex items-center gap-2 rounded-xl border border-amber-250 bg-amber-50 px-4 py-3 text-xs text-amber-800 font-semibold select-none shadow-sm">
                                            <span>🔒</span>
                                            <span>
                                                Cette session est terminée. Le brainstorming est en mode lecture seule.
                                            </span>
                                        </div>
                                    )}

                                    {/* Add Idea Input */}
                                    <form 
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (!isCompleted) addIdea(newIdeaText);
                                        }} 
                                        className="flex gap-2"
                                    >
                                        <input
                                            type="text"
                                            value={newIdeaText}
                                            onChange={(e) => setNewIdeaText(e.target.value)}
                                            placeholder={isCompleted ? "Le brainstorming est en lecture seule..." : "Une idée géniale..."}
                                            disabled={isCompleted}
                                            className={`flex-1 rounded-xl border px-3 py-2.5 text-xs outline-none transition font-medium ${
                                                isCompleted 
                                                    ? "bg-[#f3f0ea] border-[#dad7d1] text-slate-400 cursor-not-allowed shadow-neu-inset-sm" 
                                                    : "bg-[#f3f0ea] border-[#dad7d1] text-slate-900 focus:border-[#dad7d1]/80 placeholder:text-slate-400 shadow-neu-inset-sm"
                                            }`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isCompleted || !newIdeaText.trim()}
                                            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-neu-flat-sm cursor-pointer ${
                                                isCompleted 
                                                    ? "bg-[#f3f0ea] text-slate-450 border border-[#dad7d1] cursor-not-allowed" 
                                                    : "bg-[#1b202e] text-white hover:bg-[#252c3f]"
                                            }`}
                                        >
                                            Ajouter
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div className="mt-8 flex justify-end gap-3 border-t border-[#dad7d1]/50 pt-5">
                                <button
                                    type="button"
                                    onClick={handleCloseDetails}
                                    className="inline-flex items-center justify-center rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-5 py-3 text-sm font-semibold text-slate-700 shadow-neu-flat-sm transition hover:bg-[#f3f0ea]/80 hover:shadow-neu-flat cursor-pointer"
                                >
                                    Fermer
                                </button>
                                {selectedSession.status.toUpperCase() === "ACTIVE" && (
                                    <button
                                        type="button"
                                        onClick={() => handleStartSession(selectedSession.id)}
                                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-neu-flat-sm transition hover:bg-emerald-700 active:scale-[0.98] cursor-pointer"
                                    >
                                        Démarrer l&apos;atelier
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => router.push(`/board/${selectedSession.id}`)}
                                    className="inline-flex items-center justify-center rounded-2xl bg-[#1b202e] px-5 py-3 text-sm font-semibold text-white shadow-neu-flat-sm transition hover:bg-[#252c3f] active:scale-[0.98] cursor-pointer"
                                >
                                    Rejoindre l&apos;atelier direct
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })() : null}

            {canCreate && isSlidesModalOpen && editingSessionForSlides && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-[2rem] border border-white/50 bg-[#f3f0ea] p-6 shadow-2xl shadow-[#12151e]/20 max-h-[90vh] flex flex-col">
                        <div className="flex items-start justify-between gap-4 border-b border-[#dad7d1]/50 pb-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Présentation</p>
                                <h4 className="mt-1 text-xl font-bold text-[#1b202e] tracking-tight">
                                    Slides d&apos;introduction - {editingSessionForSlides.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Configurez les consignes affichées en plein écran aux participants à leur arrivée.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSlidesModalOpen(false);
                                    setEditingSessionForSlides(null);
                                }}
                                className="rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-3 py-2 text-sm font-semibold text-slate-650 shadow-neu-flat-sm transition hover:border-[#dad7d1]/80 hover:shadow-neu-flat hover:text-sky-700 cursor-pointer"
                                aria-label="Fermer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body with Scrollable Slide List */}
                        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                            {loadingSlides ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <span className="animate-spin text-2xl mb-2">🔄</span>
                                    <p className="text-xs font-semibold">Chargement des slides...</p>
                                </div>
                            ) : (
                                <>
                                    {slides.map((slide, index) => (
                                        <div 
                                            key={index} 
                                            className="rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] p-4 shadow-neu-flat-sm space-y-3 relative group"
                                        >
                                            {/* Slide Header & Move/Delete Controls */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b202e] text-[10px] font-bold text-white">
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Slide</span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={index === 0}
                                                        onClick={() => handleMoveSlideUp(index)}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#dad7d1] bg-[#f3f0ea] text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed shadow-neu-flat-sm cursor-pointer"
                                                        title="Monter"
                                                    >
                                                        ▲
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={index === slides.length - 1}
                                                        onClick={() => handleMoveSlideDown(index)}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#dad7d1] bg-[#f3f0ea] text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed shadow-neu-flat-sm cursor-pointer"
                                                        title="Descendre"
                                                    >
                                                        ▼
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSlide(index)}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#dad7d1] bg-[#f3f0ea] text-slate-455 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 shadow-neu-flat-sm cursor-pointer"
                                                        title="Supprimer la slide"
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Inputs */}
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={slide.title}
                                                    onChange={(e) => handleUpdateSlide(index, "title", e.target.value)}
                                                    placeholder="Titre de la slide (ex: Consigne 1 : Brainstorming libre)"
                                                    className="w-full rounded-xl border border-[#dad7d1] bg-[#f3f0ea] px-3.5 py-2 text-xs font-semibold text-slate-850 outline-none transition focus:border-[#dad7d1]/85 shadow-neu-inset-sm"
                                                    required
                                                />
                                                <textarea
                                                    value={slide.content}
                                                    onChange={(e) => handleUpdateSlide(index, "content", e.target.value)}
                                                    placeholder="Écrivez ici les consignes, règles ou explications pour cette étape..."
                                                    rows={3}
                                                    className="w-full rounded-xl border border-[#dad7d1] bg-[#f3f0ea] px-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-[#dad7d1]/85 shadow-neu-inset-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {slides.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-455 border-2 border-dashed border-[#dad7d1] rounded-2xl bg-[#f3f0ea]/50">
                                            <span className="text-3xl mb-2">📽️</span>
                                            <p className="text-xs font-bold">Aucune slide configurée</p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Ajoutez votre première slide de présentation pour guider vos participants.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Modal Actions Footer */}
                        <div className="border-t border-[#dad7d1]/50 pt-4 flex justify-between gap-3 mt-2">
                            <button
                                type="button"
                                onClick={handleAddSlide}
                                className="inline-flex items-center justify-center rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-4 py-2.5 text-xs font-bold text-slate-700 shadow-neu-flat-sm transition hover:bg-[#dad7d1]/30 cursor-pointer"
                            >
                                + Ajouter une slide
                            </button>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSlidesModalOpen(false);
                                        setEditingSessionForSlides(null);
                                    }}
                                    className="inline-flex items-center justify-center rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-4 py-2.5 text-xs font-bold text-slate-750 shadow-neu-flat-sm transition hover:bg-[#f3f0ea]/80 hover:shadow-neu-flat cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    disabled={savingSlides}
                                    onClick={handleSaveSlides}
                                    className="inline-flex items-center justify-center rounded-2xl bg-[#1b202e] px-5 py-2.5 text-xs font-bold text-white shadow-neu-flat-sm transition hover:bg-[#252c3f] hover:shadow-neu-flat disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {savingSlides ? "Enregistrement..." : "Enregistrer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}