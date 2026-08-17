"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { AuthenticatedUser } from "@/types/user.types";

const sidebarItems = [
    {
        id: "join",
        label: "Rejoindre une Session",
        description: "Entrez un code ou un lien d'invitation.",
        href: "#join-session",
        tone: "sky" as const,
    },
];

const API_BASE_URL = "http://localhost:8080";

type SessionItem = {
    id: string;
    title: string;
    status: string;
    createdAt?: string;
    creatorEmail?: string;
};

export default function UserDashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
    const [invitationInput, setInvitationInput] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    useEffect(() => {
        const fetchMySessions = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await fetch(`${API_BASE_URL}/api/users/me/sessions`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error("Failed to load sessions");
                }
                const data = (await response.json()) as SessionItem[];
                setSessions(data);
            } catch (err) {
                console.error("Failed to load my sessions", err);
                setSessions([]);
            } finally {
                setLoadingSessions(false);
            }
        };
        void fetchMySessions();
    }, []);

    const handleJoin = () => {
        const input = invitationInput.trim();
        if (!input) {
            setErrorMsg("Veuillez saisir un lien d'invitation ou un code.");
            return;
        }

        // Extract token if it's a full URL
        let token = input;
        try {
            if (input.includes("/session/")) {
                const parts = input.split("/session/");
                if (parts.length > 1) {
                    token = parts[1].split(/[?#]/)[0]; // strip query parameters or hashes
                }
            } else if (input.startsWith("http://") || input.startsWith("https://")) {
                const url = new URL(input);
                const pathParts = url.pathname.split("/").filter(Boolean);
                if (pathParts.length > 0) {
                    token = pathParts[pathParts.length - 1];
                }
            }
        } catch (e) {
            console.error("Failed to parse URL, using raw input as token", e);
        }

        token = token.trim();
        if (!token) {
            setErrorMsg("Code d'invitation invalide.");
            return;
        }

        router.push(`/session/${token}`);
    };

    return (
        <DashboardShell
            requiredRole="USER"
            title="Espace utilisateur BrainFlow"
            subtitle="Accédez instantanément à vos ateliers de brainstorming en saisissant votre invitation."
            sidebarItems={sidebarItems}
            onUserLoaded={setCurrentUser}
        >
            <div id="join-session" className="p-6 max-w-6xl mx-auto space-y-8">
                {/* Section Top (Rejoindre) */}
                <div className="w-full rounded-3xl border border-[#dad7d1] bg-[#f3f0ea] p-6 shadow-neu-flat-sm">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                        Rejoindre une session de Brainstorming
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={invitationInput}
                                onChange={(e) => {
                                    setInvitationInput(e.target.value);
                                    setErrorMsg("");
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                                placeholder="Collez votre lien d'invitation ou votre code ici..."
                                className="w-full rounded-xl border border-[#dad7d1] bg-[#f3f0ea] px-4 py-3 text-sm text-[#1a1f2c] outline-none placeholder:text-slate-400 focus:border-[#dad7d1]/80 focus:shadow-neu-inset shadow-neu-inset-sm transition-all"
                            />
                            {errorMsg && (
                                <p className="mt-1.5 text-xs text-rose-500 font-medium">
                                    {errorMsg}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleJoin}
                            className="sm:w-40 w-full rounded-xl bg-[#1b202e] px-6 py-3 text-sm font-semibold text-white shadow-neu-flat-sm transition hover:bg-[#252c3f] hover:shadow-neu-flat active:scale-[0.98] cursor-pointer"
                        >
                            Rejoindre
                        </button>
                    </div>
                </div>

                {/* Section Bottom (Mes Sessions) */}
                <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#1b202e] tracking-tight">
                        Mes Sessions (En attente &amp; Historique)
                    </h3>
                    
                    {loadingSessions ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, idx) => (
                                <div key={idx} className="animate-pulse rounded-2xl border border-[#dad7d1] bg-[#f3f0ea]/70 p-6 h-32 shadow-neu-inset-sm" />
                            ))}
                        </div>
                    ) : sessions.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {sessions.map((session) => (
                                <article 
                                    key={session.id} 
                                    onClick={() => router.push(`/board/${session.id}`)}
                                    className="group cursor-pointer rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] p-5 shadow-neu-flat-sm transition hover:-translate-y-0.5 hover:border-[#dad7d1]/80 hover:shadow-neu-flat"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Session</span>
                                            <h4 className="text-sm font-semibold text-slate-850 group-hover:text-sky-700 transition">
                                                {session.title}
                                            </h4>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-[#f3f0ea] border border-[#dad7d1] px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-neu-flat-sm">
                                            {session.status}
                                        </span>
                                    </div>
                                    {session.createdAt && (
                                        <div className="mt-4 pt-3 border-t border-[#dad7d1]/50 flex items-center text-[10px] text-slate-450">
                                            👤 {session.creatorEmail?.split("@")[0] || "Animateur"} &bull; 📅 {session.createdAt}
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-[#dad7d1] bg-[#f3f0ea] p-10 text-center shadow-neu-inset-sm">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] text-lg mb-3 shadow-neu-flat-sm select-none">
                                📂
                            </div>
                            <p className="text-sm font-semibold text-slate-700">
                                Vous n&apos;avez rejoint aucune session pour le moment.
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Utilisez un lien d&apos;invitation pour accéder à une salle d&apos;attente.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}
