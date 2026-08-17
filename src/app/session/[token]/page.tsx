"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainFlowLogo } from "@/components/brand/brainflow-logo";

interface SessionParticipant {
    id?: number;
    title: string;
    animator: string;
    date: string;
    status: string;
    participantStatus?: string;
}

interface SessionPageProps {
    params: Promise<{ token: string }>;
}

const API_BASE_URL = "http://localhost:8080";

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
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export default function SessionPage({ params }: SessionPageProps) {
    const { token } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ status?: number; message: string } | null>(null);
    const [session, setSession] = useState<SessionParticipant | null>(null);

    const checkToken = async (isSilent = false) => {
        if (!isSilent) {
            setLoading(true);
        }
        setError(null);

        const tokenJwt = localStorage.getItem("token");
        if (!tokenJwt) {
            router.push("/login");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/sessions/join/${encodeURIComponent(token)}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${tokenJwt}`,
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setError({
                        status: 404,
                        message: "Lien d'invitation invalide ou expiré. Veuillez contacter l'animateur de la réunion.",
                    });
                } else if (response.status === 403) {
                    setError({
                        status: 403,
                        message: "Cette réunion a été clôturée ou terminée par l'animateur.",
                    });
                } else {
                    setError({
                        status: response.status,
                        message: "Impossible d'accéder à la réunion. Code d'erreur : " + response.status,
                    });
                }
                return;
            }

            const data = (await response.json()) as SessionParticipant;
            setSession(data);

            const statusUpper = (data.status ?? "").toUpperCase();
            const partStatusUpper = (data.participantStatus ?? "").toUpperCase();
            if (partStatusUpper === "APPROVED" && statusUpper === "IN_PROGRESS") {
                if (data.id) {
                    router.push(`/board/${data.id}`);
                }
            } else {
                console.log("Lobby state: participantStatus =", partStatusUpper, "sessionStatus =", statusUpper);
            }
        } catch {
            if (!isSilent) {
                setError({
                    message: "Impossible de se connecter au serveur. Vérifiez votre connexion ou l'état du serveur.",
                });
            }
        } finally {
            if (!isSilent) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const tokenJwt = localStorage.getItem("token");
        if (!tokenJwt) {
            router.push("/login");
            return;
        }

        if (token) {
            void checkToken(false);
        }

        const intervalId = setInterval(() => {
            if (token) {
                void checkToken(true);
            }
        }, 4000);

        return () => clearInterval(intervalId);
    }, [token]);

    return (
        <main className="min-h-screen bg-[#f3f0ea] px-4 py-6 text-[#1a1f2c] sm:px-6 lg:px-8 flex flex-col justify-between">
            {/* Top Navigation */}
            <header className="mx-auto w-full max-w-6xl flex justify-start">
                <BrainFlowLogo href="#" />
            </header>

            {/* Main Content Card */}
            <section className="mx-auto flex w-full max-w-2xl items-center justify-center p-4">
                <div className="w-full rounded-[2.5rem] border border-white/50 bg-[#f3f0ea] p-8 md:p-12 shadow-neu-flat animate-[fadeIn_0.5s_ease-out]">
                    {loading ? (
                        /* Spinner / Skeleton State */
                        <div className="flex flex-col items-center justify-center space-y-6 py-8">
                            <div className="relative flex items-center justify-center">
                                <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/40 border-t-slate-800 shadow-neu-flat-sm"></div>
                                <span className="absolute text-xl animate-pulse">⚡</span>
                            </div>
                            <div className="space-y-3 text-center w-full max-w-xs">
                                <div className="h-4 bg-slate-200/50 rounded-full w-2/3 mx-auto animate-pulse"></div>
                                <div className="h-3 bg-slate-200/50 rounded-full w-5/6 mx-auto animate-pulse"></div>
                            </div>
                        </div>
                    ) : error ? (
                        /* Error State */
                        <div className="space-y-6 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f3f0ea] border border-rose-250 text-3xl shadow-neu-flat-sm animate-pulse">
                                ⚠️
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                                    {error.status === 404 ? "Lien invalide" : error.status === 403 ? "Réunion terminée" : "Une erreur est survenue"}
                                </h2>
                                <p className="text-sm leading-6 text-slate-600">
                                    {error.message}
                                </p>
                            </div>
                            <div className="pt-4">
                                <button
                                    onClick={() => void checkToken()}
                                    className="inline-flex items-center justify-center rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-5 py-3 text-sm font-semibold text-slate-700 shadow-neu-flat-sm transition hover:border-[#dad7d1]/80 hover:shadow-neu-flat hover:text-sky-700 cursor-pointer"
                                >
                                    Actualiser la page
                                </button>
                            </div>
                        </div>
                    ) : session ? (
                        /* Success State (Waiting Room) */
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center rounded-full bg-[#f3f0ea] border border-[#dad7d1] px-3 py-1 text-xs font-semibold text-slate-600 shadow-neu-flat-sm uppercase tracking-wide">
                                    Salle d&apos;attente
                                </span>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                                    {session.title}
                                </h1>
                                <p className="text-sm text-slate-500 font-medium">
                                    Vous rejoignez cette session en tant que collaborateur externe.
                                </p>
                            </div>

                            {/* Meeting details metadata */}
                            <div className="grid gap-4 sm:grid-cols-2 rounded-[2rem] border border-[#dad7d1] bg-[#f3f0ea] p-6 shadow-neu-inset-sm">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Animateur</p>
                                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <span>👤</span> {session.animator.split("@")[0]}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date de création</p>
                                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <span>📅</span> {formatDate(session.date)}
                                    </p>
                                </div>
                            </div>

                            {/* Welcome / Waiting Message */}
                            <div className="rounded-[1.5rem] border border-[#dad7d1] bg-[#f3f0ea] p-6 text-center space-y-3 shadow-neu-flat-sm">
                                <div className="flex justify-center items-center gap-2">
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-sky-850 select-none">
                                        Vérification validée
                                    </span>
                                </div>
                                <p className="text-base font-bold text-slate-850">
                                    {session.participantStatus?.toUpperCase() === "WAITING"
                                        ? "Votre demande est en attente de validation par l'animateur."
                                        : "Bienvenue. En attente du lancement de la réunion par l&apos;animateur."}
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                    {session.participantStatus?.toUpperCase() === "WAITING"
                                        ? "Une fois admis, vous serez automatiquement redirigé vers le tableau blanc."
                                        : "Cette page se mettra à jour ou l&apos;accès commencera automatiquement une fois la réunion activée."}
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </section>

            {/* Bottom Footer */}
            <footer className="mx-auto py-4 text-center text-xs text-slate-450 select-none">
                &copy; {new Date().getFullYear()} BrainFlow. Tous droits réservés.
            </footer>
        </main>
    );
}
