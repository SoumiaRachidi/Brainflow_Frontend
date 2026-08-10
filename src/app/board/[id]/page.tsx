"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface PostIt {
    id: string;
    text: string;
    x: number;
    y: number;
    votes: number;
    color: "yellow" | "pink" | "blue" | "green";
}

const COLOR_MAP = {
    yellow: {
        bg: "bg-amber-100/95 hover:bg-amber-100",
        border: "border-amber-200",
        text: "text-amber-900",
        dot: "bg-amber-400",
        textarea: "placeholder:text-amber-800/40 text-amber-900",
    },
    pink: {
        bg: "bg-rose-100/95 hover:bg-rose-100",
        border: "border-rose-200",
        text: "text-rose-900",
        dot: "bg-rose-400",
        textarea: "placeholder:text-rose-800/40 text-rose-900",
    },
    blue: {
        bg: "bg-sky-100/95 hover:bg-sky-100",
        border: "border-sky-200",
        text: "text-sky-900",
        dot: "bg-sky-400",
        textarea: "placeholder:text-sky-800/40 text-sky-900",
    },
    green: {
        bg: "bg-emerald-100/95 hover:bg-emerald-100",
        border: "border-emerald-200",
        text: "text-emerald-900",
        dot: "bg-emerald-400",
        textarea: "placeholder:text-emerald-800/40 text-emerald-900",
    },
};

interface BoardPageProps {
    params: Promise<{ id: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
    const router = useRouter();
    const { id } = use(params);

    const [sessionTitle, setSessionTitle] = useState("Session de Brainstorming");
    const [postIts, setPostIts] = useState<PostIt[]>([]);
    
    // Drag and Drop state
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Fetch the actual title of the session
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token && id) {
            fetch(`http://localhost:8080/api/sessions`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => {
                    if (res.ok) return res.json();
                    throw new Error();
                })
                .then((data: unknown) => {
                    if (Array.isArray(data)) {
                        const matched = data.find((s) => String((s as { id?: number | string }).id) === String(id));
                        if (matched && typeof (matched as { title: string }).title === "string") {
                            setSessionTitle((matched as { title: string }).title);
                        }
                    }
                })
                .catch(() => {});
        }
    }, [id]);

    // Initial post-its on load
    useEffect(() => {
        const saved = localStorage.getItem(`board-postits-${id}`);
        if (saved) {
            try {
                setPostIts(JSON.parse(saved));
                return;
            } catch {
                // fall back to default if parsing errors
            }
        }

        // Default initial items
        setPostIts([
            {
                id: "init-1",
                text: "Développer une interface collaborative intuitive style Miro",
                x: 120,
                y: 180,
                votes: 4,
                color: "yellow",
            },
            {
                id: "init-2",
                text: "Sécuriser les endpoints d'administration de BrainFlow",
                x: 440,
                y: 280,
                votes: 7,
                color: "blue",
            },
            {
                id: "init-3",
                text: "Tester la réactivité du Drag and Drop en pur JS/Tailwind",
                x: 760,
                y: 200,
                votes: 2,
                color: "pink",
            },
        ]);
    }, [id]);

    // Persist postits locally
    const savePostIts = (updated: PostIt[]) => {
        setPostIts(updated);
        localStorage.setItem(`board-postits-${id}`, JSON.stringify(updated));
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, postItId: string) => {
        const target = e.target as HTMLElement;
        // Don't drag if editing text, clicking vote button or delete button
        if (
            target.tagName === "TEXTAREA" ||
            target.tagName === "BUTTON" ||
            target.closest("button") ||
            target.closest(".no-drag")
        ) {
            return;
        }

        const postIt = postIts.find((p) => p.id === postItId);
        if (!postIt) return;

        // Set pointer capture to track moves outside the postit bounds
        e.currentTarget.setPointerCapture(e.pointerId);

        setActiveDragId(postItId);
        setDragOffset({
            x: e.clientX - postIt.x,
            y: e.clientY - postIt.y,
        });
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!activeDragId) return;

        const nextX = e.clientX - dragOffset.x;
        const nextY = e.clientY - dragOffset.y;

        // Update coordinate positions
        setPostIts((prev) =>
            prev.map((p) => (p.id === activeDragId ? { ...p, x: nextX, y: nextY } : p))
        );
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (activeDragId) {
            // Save state when drag ends
            savePostIts(postIts);
            setActiveDragId(null);
        }
    };

    const addPostIt = (color: "yellow" | "pink" | "blue" | "green") => {
        // Spawn staggered near the center of the viewport
        const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1000;
        const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 600;
        
        const nextX = Math.max(40, viewportWidth / 2 - 120 + (postIts.length * 15) % 120);
        const nextY = Math.max(120, viewportHeight / 2 - 110 + (postIts.length * 15) % 100);

        const newPost: PostIt = {
            id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            text: "",
            x: nextX,
            y: nextY,
            votes: 0,
            color,
        };

        savePostIts([...postIts, newPost]);
    };

    const updatePostItText = (postItId: string, text: string) => {
        const updated = postIts.map((p) => (p.id === postItId ? { ...p, text } : p));
        savePostIts(updated);
    };

    const handleVote = (postItId: string) => {
        const updated = postIts.map((p) => (p.id === postItId ? { ...p, votes: p.votes + 1 } : p));
        savePostIts(updated);
    };

    const handleDelete = (postItId: string) => {
        const updated = postIts.filter((p) => p.id !== postItId);
        savePostIts(updated);
    };

    return (
        <main 
            className="relative h-screen w-screen bg-slate-50 overflow-hidden select-none bg-[radial-gradient(#e5e7eb_1.2px,transparent_1.2px)] [background-size:24px_24px]"
            onPointerMove={handlePointerMove}
        >
            {/* Header Flottant */}
            <header className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <span className="text-xl">⚡</span>
                    <div>
                        <h1 className="text-sm font-semibold text-slate-800 truncate max-w-[240px] md:max-w-md">
                            {sessionTitle}
                        </h1>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            BrainFlow Whiteboard • ID: {id}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => router.push("/user-dashboard")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                    <span>←</span> Retour au Dashboard
                </button>
            </header>

            {/* Zone de Canvas des Post-its */}
            <div 
                className="absolute inset-0 z-10"
                onPointerUp={handlePointerUp}
            >
                {postIts.map((post) => {
                    const theme = COLOR_MAP[post.color];
                    const isDragging = activeDragId === post.id;

                    return (
                        <div
                            key={post.id}
                            onPointerDown={(e) => handlePointerDown(e, post.id)}
                            style={{ 
                                left: `${post.x}px`, 
                                top: `${post.y}px`,
                                zIndex: isDragging ? 30 : 20,
                            }}
                            className={`absolute w-60 min-h-[14rem] flex flex-col rounded-xl border p-3 shadow-sm hover:shadow-md transition-shadow select-text ${theme.bg} ${theme.border} ${isDragging ? "cursor-grabbing shadow-lg" : "cursor-grab"}`}
                        >
                            {/* Titre/Dragger Top Bar */}
                            <div className="flex items-center justify-between pb-2 mb-1 border-b border-black/[0.04]">
                                <div className="flex items-center gap-1.5 no-drag">
                                    <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-black/35 select-none">
                                        Idée
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(post.id)}
                                    className="text-black/30 hover:text-rose-600 transition-colors text-xs p-0.5"
                                    title="Supprimer le post-it"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Text Input Area */}
                            <textarea
                                value={post.text}
                                onChange={(e) => updatePostItText(post.id, e.target.value)}
                                placeholder="Tapez votre idée ici..."
                                className={`flex-1 w-full bg-transparent resize-none outline-none text-xs font-medium leading-relaxed placeholder:opacity-50 ${theme.textarea}`}
                            />

                            {/* bottom actions / Voting */}
                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/5 no-drag">
                                <span className={`text-[10px] font-bold ${theme.text} select-none`}>
                                    👍 {post.votes} {post.votes > 1 ? "votes" : "vote"}
                                </span>
                                
                                <button
                                    type="button"
                                    onClick={() => handleVote(post.id)}
                                    className={`inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white/70 px-2 py-1 text-[10px] font-bold shadow-xs transition hover:bg-white hover:scale-105 active:scale-95 ${theme.text}`}
                                >
                                    Voter
                                </button>
                            </div>
                        </div>
                    );
                })}

                {postIts.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                        <span className="text-4xl mb-2">💡</span>
                        <p className="text-sm font-medium">Le tableau est vide.</p>
                        <p className="text-xs">Ajoutez un post-it à l'aide de la barre ci-dessous.</p>
                    </div>
                )}
            </div>

            {/* Barre de contrôle flottante (Spawns Post-its) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-lg">
                <span className="text-xs font-bold text-slate-400 px-1 border-r border-slate-100 pr-3">
                    POST-ITS
                </span>
                
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => addPostIt("yellow")}
                        className="h-8 w-8 rounded-full bg-amber-100 border border-amber-300 hover:scale-110 active:scale-95 transition-transform"
                        title="Ajouter un Post-it jaune"
                    />
                    <button
                        type="button"
                        onClick={() => addPostIt("pink")}
                        className="h-8 w-8 rounded-full bg-rose-100 border border-rose-300 hover:scale-110 active:scale-95 transition-transform"
                        title="Ajouter un Post-it rose"
                    />
                    <button
                        type="button"
                        onClick={() => addPostIt("blue")}
                        className="h-8 w-8 rounded-full bg-sky-100 border border-sky-300 hover:scale-110 active:scale-95 transition-transform"
                        title="Ajouter un Post-it bleu"
                    />
                    <button
                        type="button"
                        onClick={() => addPostIt("green")}
                        className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-300 hover:scale-110 active:scale-95 transition-transform"
                        title="Ajouter un Post-it vert"
                    />
                </div>
            </div>
        </main>
    );
}
