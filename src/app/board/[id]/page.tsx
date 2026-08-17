"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface PostIt {
    id: number | string;
    text: string;
    x: number;
    y: number;
    votes: number;
    color: "yellow" | "pink" | "blue" | "green";
    votedByMe?: boolean;
}

interface IdeaComment {
    id: number;
    content: string;
    createdAt: string;
    ideaId: number;
    userId: number;
    username: string;
    userEmail: string;
    parentId: number | null;
    resolved: boolean;
}

interface SessionDecision {
    id: number;
    sessionId: number;
    content: string;
    decisionType: "DO" | "DONT";
    createdAt: string;
    ideaId?: number | string;
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
    const [activeDragId, setActiveDragId] = useState<number | string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [editingPostItId, setEditingPostItId] = useState<number | string | null>(null);

    // View mode and user role states
    const [viewMode, setViewMode] = useState<"board" | "list">("board");
    const [userRole, setUserRole] = useState<string | null>(null);

    // Discussion state
    const [activeCommentPostIt, setActiveCommentPostIt] = useState<PostIt | null>(null);
    const [comments, setComments] = useState<IdeaComment[]>([]);
    const [newCommentText, setNewCommentText] = useState("");
    const [replyingToComment, setReplyingToComment] = useState<IdeaComment | null>(null);
    const [loadingComments, setLoadingComments] = useState(false);

    // Decisions drawer states
    const [isDecisionsDrawerOpen, setIsDecisionsDrawerOpen] = useState(false);
    const [decisions, setDecisions] = useState<SessionDecision[]>([]);
    const [newDoText, setNewDoText] = useState("");
    const [newDontText, setNewDontText] = useState("");
    const [loadingDecisions, setLoadingDecisions] = useState(false);
    const [highlightedPostItId, setHighlightedPostItId] = useState<number | string | null>(null);

    // Presentation Slides State
    const [slides, setSlides] = useState<{ id: number; title: string; content: string; slideOrder: number }[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [showSlidesOverlay, setShowSlidesOverlay] = useState(false);

    const handleReturnDashboard = () => {
        const role = localStorage.getItem("role");
        if (role === "ANIMATOR") {
            router.push("/animator-dashboard");
        } else if (role === "ADMIN") {
            router.push("/admin-dashboard");
        } else {
            router.push("/user-dashboard");
        }
    };

    // Fetch user role, session details, and ideas on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        setUserRole(localStorage.getItem("role"));

        // Verify user and cache role
        fetch("http://localhost:8080/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error("Unauthorized");
            })
            .then((data: any) => {
                if (data && data.systemRole) {
                    localStorage.setItem("role", data.systemRole);
                    setUserRole(data.systemRole);
                }
            })
            .catch(() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                router.push("/login");
            });

        if (!id) return;

        // Fetch session title
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

        // Fetch ideas
        fetch(`http://localhost:8080/api/sessions/${id}/ideas`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error("Unable to fetch ideas");
            })
            .then((data: any[]) => {
                const loaded = data.map((item) => ({
                    id: item.id,
                    text: item.content || "",
                    x: item.x || 100,
                    y: item.y || 100,
                    votes: item.votes || 0,
                    color: item.color || "yellow",
                    votedByMe: item.votedByMe || false,
                }));
                setPostIts(loaded);
            })
            .catch((err) => {
                console.error("Error loading ideas:", err);
            });

        // Fetch session slides
        fetch(`http://localhost:8080/api/sessions/${id}/slides`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) return res.json();
                return [];
            })
            .then((data) => {
                if (data && data.length > 0) {
                    setSlides(data);
                    setShowSlidesOverlay(true);
                }
            })
            .catch((err) => console.error("Error fetching slides:", err));
    }, [id, router]);

    useEffect(() => {
        if (!activeCommentPostIt) return;

        const interval = setInterval(() => {
            const token = localStorage.getItem("token");
            if (!token) return;
            fetch(`http://localhost:8080/api/ideas/${activeCommentPostIt.id}/comments`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((res) => {
                    if (res.ok) return res.json();
                })
                .then((data) => {
                    if (data) setComments(data);
                })
                .catch((err) => console.error("Error polling comments:", err));
        }, 3000);

        return () => clearInterval(interval);
    }, [activeCommentPostIt]);

    useEffect(() => {
        if (!id) return;

        const interval = setInterval(() => {
            const token = localStorage.getItem("token");
            if (!token) return;

            fetch(`http://localhost:8080/api/sessions/${id}/ideas`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => {
                    if (res.ok) return res.json();
                })
                .then((data) => {
                    if (Array.isArray(data)) {
                        setPostIts((prev) => {
                            return data.map((item) => {
                                const existing = prev.find((p) => String(p.id) === String(item.id));
                                const isEditing = activeDragId === item.id || editingPostItId === item.id;
                                
                                return {
                                    id: item.id,
                                    text: isEditing ? (existing?.text || "") : (item.content || ""),
                                    x: isEditing ? (existing?.x || 0) : (item.x || 100),
                                    y: isEditing ? (existing?.y || 0) : (item.y || 100),
                                    votes: item.votes || 0,
                                    color: item.color || "yellow",
                                    votedByMe: item.votedByMe || false,
                                };
                            });
                        });
                    }
                })
                .catch((err) => console.error("Error polling ideas:", err));
        }, 4000);

        return () => clearInterval(interval);
    }, [id, activeDragId, editingPostItId]);

    const savePostItToServer = async (
        postItId: number | string,
        text: string,
        color: "yellow" | "pink" | "blue" | "green",
        x: number,
        y: number,
        votes: number
    ) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            await fetch(`http://localhost:8080/api/ideas/${postItId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    content: text,
                    color,
                    x,
                    y,
                    votes,
                }),
            });
        } catch (err) {
            console.error("Error updating post-it:", err);
        }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, postItId: number | string) => {
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
            const postIt = postIts.find((p) => p.id === activeDragId);
            if (postIt) {
                savePostItToServer(postIt.id, postIt.text, postIt.color, postIt.x, postIt.y, postIt.votes);
            }
            setActiveDragId(null);
        }
    };

    const addPostIt = async (color: "yellow" | "pink" | "blue" | "green") => {
        const token = localStorage.getItem("token");
        if (!token || !id) return;

        // Spawn staggered near the center of the viewport
        const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1000;
        const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 600;
        
        const nextX = Math.max(40, viewportWidth / 2 - 120 + (postIts.length * 15) % 120);
        const nextY = Math.max(120, viewportHeight / 2 - 110 + (postIts.length * 15) % 100);

        const payload = {
            content: "",
            color,
            x: nextX,
            y: nextY,
            votes: 0,
        };

        try {
            const res = await fetch(`http://localhost:8080/api/sessions/${id}/ideas`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const savedIdea = await res.json();
                const newPost: PostIt = {
                    id: savedIdea.id,
                    text: savedIdea.content || "",
                    x: savedIdea.x,
                    y: savedIdea.y,
                    votes: savedIdea.votes,
                    color: savedIdea.color,
                    votedByMe: false,
                };
                setPostIts((prev) => [...prev, newPost]);
            }
        } catch (err) {
            console.error("Error creating post-it:", err);
        }
    };

    const updatePostItText = (postItId: number | string, text: string) => {
        setPostIts((prev) =>
            prev.map((p) => (p.id === postItId ? { ...p, text } : p))
        );
    };

    const handleVote = async (postItId: number | string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`http://localhost:8080/api/ideas/${postItId}/vote`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const updatedIdea = await res.json();
                setPostIts((prev) =>
                    prev.map((p) => (p.id === postItId ? { 
                        ...p, 
                        votes: updatedIdea.votes, 
                        votedByMe: updatedIdea.votedByMe 
                    } : p))
                );
            }
        } catch (err) {
            console.error("Error voting idea:", err);
        }
    };

    const handleDelete = async (postItId: number | string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`http://localhost:8080/api/ideas/${postItId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                setPostIts((prev) => prev.filter((p) => p.id !== postItId));
            }
        } catch (err) {
            console.error("Error deleting idea:", err);
        }
    };

    const organizeByVotes = () => {
        const sorted = [...postIts].sort((a, b) => b.votes - a.votes);
        const cols = 4;
        const startX = 60;
        const startY = 140;
        const colWidth = 260;
        const rowHeight = 250;

        const updated = sorted.map((post, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const nextX = startX + col * colWidth;
            const nextY = startY + row * rowHeight;

            // Save to server
            void savePostItToServer(post.id, post.text, post.color, nextX, nextY, post.votes);

            return {
                ...post,
                x: nextX,
                y: nextY
            };
        });
        setPostIts(updated);
    };

    const handleToggleResolveComment = async (commentId: number, currentResolved: boolean) => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`http://localhost:8080/api/comments/${commentId}/resolve?resolved=${!currentResolved}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.ok) {
                const updatedComment = await res.json();
                setComments((prev) =>
                    prev.map((c) => (c.id === commentId ? { ...c, resolved: updatedComment.resolved } : c))
                );
            }
        } catch (err) {
            console.error("Error toggling resolve comment:", err);
        }
    };

    const fetchComments = async (ideaId: number | string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setLoadingComments(true);
        try {
            const res = await fetch(`http://localhost:8080/api/ideas/${ideaId}/comments`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (err) {
            console.error("Error fetching comments:", err);
        } finally {
            setLoadingComments(false);
        }
    };

    const openComments = (post: PostIt) => {
        setActiveCommentPostIt(post);
        setNewCommentText("");
        setReplyingToComment(null);
        void fetchComments(post.id);
    };

    const closeComments = () => {
        setActiveCommentPostIt(null);
        setComments([]);
        setNewCommentText("");
        setReplyingToComment(null);
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim() || !activeCommentPostIt) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        const payload = {
            content: newCommentText.trim(),
            parentId: replyingToComment ? replyingToComment.id : null,
        };

        try {
            const res = await fetch(`http://localhost:8080/api/ideas/${activeCommentPostIt.id}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const savedComment = await res.json();
                setComments((prev) => [...prev, savedComment]);
                setNewCommentText("");
                setReplyingToComment(null);
            }
        } catch (err) {
            console.error("Error posting comment:", err);
        }
    };

    const renderCommentNode = (comment: IdeaComment) => {
        const children = comments.filter((c) => c.parentId === comment.id);

        return (
            <div key={comment.id} className="space-y-3">
                {/* Comment Card */}
                <div className={`group relative rounded-2xl border p-3 shadow-neu-flat-sm transition hover:shadow-neu-flat ${
                    comment.resolved 
                        ? "border-emerald-200 bg-emerald-50/50" 
                        : "border-[#dad7d1] bg-[#f3f0ea]"
                }`}>
                    <div className="flex items-start gap-2.5">
                        {/* Avatar */}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1b202e] text-[10px] font-bold text-white uppercase shadow-neu-flat-sm select-none">
                            {comment.username ? comment.username.charAt(0) : "U"}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 font-medium">
                            <div className="flex items-baseline justify-between gap-2">
                                <span className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                                    {comment.username || comment.userEmail}
                                    {comment.resolved && (
                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-black text-emerald-800 uppercase shadow-xs border border-emerald-200 select-none">
                                            ✓ Réglé
                                        </span>
                                    )}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className={`mt-1 text-xs break-words leading-relaxed ${comment.resolved ? "text-slate-500 line-through decoration-slate-350" : "text-slate-650"}`}>
                                {comment.content}
                            </p>

                            {/* Actions line */}
                            <div className="mt-1.5 flex items-center gap-3">
                                {/* Reply button */}
                                <button
                                    type="button"
                                    onClick={() => setReplyingToComment(comment)}
                                    className="text-[10px] font-bold text-sky-600 hover:text-sky-850 transition cursor-pointer"
                                >
                                    Répondre
                                </button>

                                {/* Resolve toggle button (only visible to Animators/Admins) */}
                                {(userRole === "ANIMATOR" || userRole === "ADMIN") && (
                                    <button
                                        type="button"
                                        onClick={() => handleToggleResolveComment(comment.id, comment.resolved)}
                                        className={`text-[10px] font-bold transition cursor-pointer ${
                                            comment.resolved
                                                ? "text-slate-500 hover:text-slate-700"
                                                : "text-emerald-600 hover:text-emerald-850"
                                        }`}
                                    >
                                        {comment.resolved ? "Marquer non réglé" : "Marquer réglé"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Render children recursively */}
                {children.length > 0 && (
                    <div className="space-y-3 border-l border-[#dad7d1]/50 ml-3.5 pl-3.5">
                        {children.map((child) => renderCommentNode(child))}
                    </div>
                )}
            </div>
        );
    };
    const fetchDecisions = async () => {
        const token = localStorage.getItem("token");
        if (!token || !id) return;
        setLoadingDecisions(true);
        try {
            const res = await fetch(`http://localhost:8080/api/sessions/${id}/decisions`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setDecisions(data);
            }
        } catch (err) {
            console.error("Error fetching decisions:", err);
        } finally {
            setLoadingDecisions(false);
        }
    };

    const handleAddDecision = async (content: string, type: "DO" | "DONT", ideaId?: number | string) => {
        if (!content.trim()) return;
        const token = localStorage.getItem("token");
        if (!token || !id) return;
        const ideaIdParam = ideaId ? `&ideaId=${ideaId}` : "";
        try {
            const res = await fetch(`http://localhost:8080/api/sessions/${id}/decisions?content=${encodeURIComponent(content)}&decisionType=${type}${ideaIdParam}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.ok) {
                const newDecision = await res.json();
                setDecisions((prev) => [...prev, newDecision]);
                if (type === "DO") setNewDoText("");
                else setNewDontText("");
            }
        } catch (err) {
            console.error("Error adding decision:", err);
        }
    };

    const handleQuickDecision = async (ideaId: number | string, content: string, type: "DO" | "DONT") => {
        await handleAddDecision(content, type, ideaId);
    };

    const handleHighlightPostIt = (ideaId: number | string) => {
        setViewMode("board");
        setTimeout(() => {
            const element = document.getElementById(`post-it-${ideaId}`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                setHighlightedPostItId(ideaId);
                setTimeout(() => {
                    setHighlightedPostItId(null);
                }, 3000);
            }
        }, 100);
    };

    const handleDeleteDecision = async (decisionId: number) => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`http://localhost:8080/api/decisions/${decisionId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.ok) {
                setDecisions((prev) => prev.filter((d) => d.id !== decisionId));
            }
        } catch (err) {
            console.error("Error deleting decision:", err);
        }
    };

    useEffect(() => {
        if (id) {
            void fetchDecisions();
        }
    }, [id]);

    return (
        <main 
            className="relative h-screen w-screen bg-[#f3f0ea] overflow-hidden select-none bg-[radial-gradient(#dad7d1_1.2px,transparent_1.2px)] [background-size:24px_24px]"
            onPointerMove={handlePointerMove}
        >
            {/* Focus Mode Backdrop Dims the canvas when discussion or decisions drawer is open */}
            {(activeCommentPostIt || isDecisionsDrawerOpen) && (
                <div 
                    onClick={() => {
                        closeComments();
                        setIsDecisionsDrawerOpen(false);
                    }}
                    className="fixed inset-0 z-30 bg-[#1a1f2c]/30 backdrop-blur-[2px] transition-opacity duration-300 cursor-pointer animate-[fadeIn_0.2s_ease-out]"
                />
            )}

            {/* Header Flottant */}
            <header className="fixed top-4 left-4 right-4 z-40 flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/50 bg-[#f3f0ea]/80 p-4 shadow-neu-flat backdrop-blur-md animate-[fadeIn_0.4s_ease-out]">
                <div className="flex items-center gap-3">
                    <span className="text-xl animate-pulse">⚡</span>
                    <div>
                        <h1 className="text-sm font-bold text-[#1b202e] truncate max-w-[240px] md:max-w-md select-none">
                            {sessionTitle}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                            BrainFlow Whiteboard • ID: {id}
                        </p>
                    </div>
                </div>

                {/* Organisation des Idées (Sort & View Mode Toolbar) */}
                <div className="flex items-center gap-2 rounded-xl bg-[#dad7d1]/30 p-1 shadow-neu-inset-sm select-none">
                    {/* Trier par votes */}
                    <button
                        type="button"
                        onClick={organizeByVotes}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f0ea] px-3 py-1.5 text-xs font-bold text-slate-750 shadow-neu-flat-sm border border-[#dad7d1]/50 hover:text-slate-950 transition hover:border-[#dad7d1] cursor-pointer"
                        title="Trier et réorganiser les post-its par nombre de votes"
                    >
                        📊 Trier par votes
                    </button>

                    <div className="h-4 w-px bg-[#dad7d1] mx-1" />

                    {/* Synthèse / Décisions */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsDecisionsDrawerOpen(true);
                            void fetchDecisions();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f0ea] px-3 py-1.5 text-xs font-bold text-[#1b202e] shadow-neu-flat-sm border border-[#dad7d1]/50 hover:text-slate-950 transition hover:border-[#dad7d1] cursor-pointer"
                        title="Ouvrir le panneau de synthèse et décisions de la session"
                    >
                        📋 Synthèse / Décisions
                    </button>

                    <div className="h-4 w-px bg-[#dad7d1] mx-1" />

                    {/* Toggle Vue Mode */}
                    <button
                        type="button"
                        onClick={() => setViewMode("board")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                            viewMode === "board"
                                ? "bg-[#1b202e] text-white shadow-sm"
                                : "text-slate-650 hover:bg-[#dad7d1]/20"
                        }`}
                    >
                        自由 Tableau
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                            viewMode === "list"
                                ? "bg-[#1b202e] text-white shadow-sm"
                                : "text-slate-650 hover:bg-[#dad7d1]/20"
                        }`}
                    >
                        📝 Liste
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleReturnDashboard}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#dad7d1] bg-[#f3f0ea] px-3.5 py-2 text-xs font-bold text-slate-750 shadow-neu-flat-sm transition hover:border-[#dad7d1]/80 hover:shadow-neu-flat hover:text-slate-950 cursor-pointer"
                >
                    <span>←</span> Retour au Dashboard
                </button>
            </header>

            {/* List View Container */}
            {viewMode === "list" ? (
                <div className="absolute inset-0 z-10 overflow-y-auto px-6 pb-28 pt-28 bg-[#f3f0ea]">
                    <div className="mx-auto max-w-6xl mt-8">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {[...postIts]
                                .sort((a, b) => b.votes - a.votes)
                                .map((post) => {
                                    const theme = COLOR_MAP[post.color];
                                    return (
                                        <div
                                            key={post.id}
                                            id={`post-it-${post.id}`}
                                            className={`w-full min-h-[14rem] flex flex-col rounded-xl border p-4 shadow-neu-flat transition-shadow ${theme.bg} ${theme.border} ${
                                                highlightedPostItId === post.id 
                                                    ? "ring-4 ring-amber-500 animate-pulse scale-105 shadow-xl transition-all duration-300" 
                                                    : ""
                                            }`}
                                        >
                                            {/* Header */}
                                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/[0.04] select-none">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-black/35">
                                                        Idée
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickDecision(post.id, post.text, "DO")}
                                                        className="text-black/30 hover:text-emerald-600 transition-colors text-xs p-0.5"
                                                        title="Valider dans la synthèse (Ce qu'on fait)"
                                                    >
                                                        🚀
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickDecision(post.id, post.text, "DONT")}
                                                        className="text-black/30 hover:text-rose-600 transition-colors text-xs p-0.5"
                                                        title="Écarter dans la synthèse (Ce qu'on ne fait pas)"
                                                    >
                                                        ❌
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openComments(post)}
                                                        className="text-black/30 hover:text-sky-600 transition-colors text-xs p-0.5 animate-pulse"
                                                        title="Ouvrir la discussion"
                                                    >
                                                        💬
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(post.id)}
                                                        className="text-black/30 hover:text-rose-600 transition-colors text-xs p-0.5"
                                                        title="Supprimer le post-it"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Text Area */}
                                            <textarea
                                                value={post.text}
                                                onFocus={() => setEditingPostItId(post.id)}
                                                onChange={(e) => updatePostItText(post.id, e.target.value)}
                                                onBlur={(e) => {
                                                    setEditingPostItId(null);
                                                    savePostItToServer(post.id, e.target.value, post.color, post.x, post.y, post.votes);
                                                }}
                                                placeholder="Tapez votre idée ici..."
                                                className={`flex-1 w-full bg-transparent resize-none outline-none text-xs font-medium leading-relaxed placeholder:opacity-50 ${theme.textarea}`}
                                            />

                                            {/* Bottom Actions */}
                                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleVote(post.id)}
                                                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer ${
                                                        post.votedByMe 
                                                            ? "bg-sky-600 text-white border-sky-700 hover:bg-sky-700 hover:text-white" 
                                                            : `border-black/10 bg-white/70 hover:bg-white ${theme.text}`
                                                    }`}
                                                >
                                                    {post.votedByMe ? "✓ Voté" : "👍 Voter"}
                                                </button>

                                                <div className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-850 shadow-xs border border-black/5 select-none">
                                                    <span className="font-bold text-slate-700">{post.votes} {post.votes > 1 ? "votes" : "vote"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {postIts.length === 0 && (
                            <div className="flex h-64 flex-col items-center justify-center text-slate-450 pointer-events-none select-none">
                                <span className="text-4xl mb-3 animate-bounce">💡</span>
                                <p className="text-sm font-bold text-slate-600">Le tableau est vide</p>
                                <p className="text-xs text-slate-500 font-medium mt-1">Ajoutez un post-it à l'aide de la barre ci-dessous.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Board View (Free Canvas) */
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
                                id={`post-it-${post.id}`}
                                onPointerDown={(e) => handlePointerDown(e, post.id)}
                                style={{ 
                                    left: `${post.x}px`, 
                                    top: `${post.y}px`,
                                    zIndex: isDragging ? 25 : 20,
                                }}
                                className={`absolute w-60 min-h-[14rem] flex flex-col rounded-xl border p-3 shadow-sm hover:shadow-md transition-shadow select-text ${theme.bg} ${theme.border} ${isDragging ? "cursor-grabbing shadow-lg animate-none" : "cursor-grab"} ${
                                    highlightedPostItId === post.id 
                                        ? "ring-4 ring-amber-500 animate-pulse scale-105 shadow-xl transition-all duration-300" 
                                        : ""
                                }`}
                            >
                                {/* Titre/Dragger Top Bar */}
                                <div className="flex items-center justify-between pb-2 mb-1 border-b border-black/[0.04]">
                                    <div className="flex items-center gap-1.5 no-drag">
                                        <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-black/35 select-none">
                                            Idée
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 no-drag">
                                        <button
                                            type="button"
                                            onClick={() => handleQuickDecision(post.id, post.text, "DO")}
                                            className="text-black/30 hover:text-emerald-600 transition-colors text-xs p-0.5"
                                            title="Valider dans la synthèse (Ce qu'on fait)"
                                        >
                                            🚀
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickDecision(post.id, post.text, "DONT")}
                                            className="text-black/30 hover:text-rose-600 transition-colors text-xs p-0.5"
                                            title="Écarter dans la synthèse (Ce qu'on ne fait pas)"
                                        >
                                            ❌
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openComments(post)}
                                            className="text-black/30 hover:text-sky-600 transition-colors text-xs p-0.5 animate-pulse"
                                            title="Ouvrir la discussion"
                                        >
                                            💬
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(post.id)}
                                            className="text-black/30 hover:text-rose-600 transition-colors text-xs p-0.5"
                                            title="Supprimer le post-it"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Text Input Area */}
                                <textarea
                                    value={post.text}
                                    onFocus={() => setEditingPostItId(post.id)}
                                    onChange={(e) => updatePostItText(post.id, e.target.value)}
                                    onBlur={(e) => {
                                        setEditingPostItId(null);
                                        savePostItToServer(post.id, e.target.value, post.color, post.x, post.y, post.votes);
                                    }}
                                    placeholder="Tapez votre idée ici..."
                                    className={`flex-1 w-full bg-transparent resize-none outline-none text-xs font-medium leading-relaxed placeholder:opacity-50 ${theme.textarea}`}
                                />

                                {/* bottom actions / Voting */}
                                <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/5 no-drag">
                                    <button
                                        type="button"
                                        onClick={() => handleVote(post.id)}
                                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer ${
                                            post.votedByMe 
                                                ? "bg-sky-600 text-white border-sky-700 hover:bg-sky-700 hover:text-white" 
                                                : `border-black/10 bg-white/70 hover:bg-white ${theme.text}`
                                        }`}
                                    >
                                        {post.votedByMe ? "✓ Voté" : "👍 Voter"}
                                    </button>

                                    <div className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-850 shadow-xs border border-black/5 select-none">
                                        <span className="font-bold text-slate-700">{post.votes} {post.votes > 1 ? "votes" : "vote"}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {postIts.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-450 pointer-events-none select-none">
                            <span className="text-4xl mb-3 animate-bounce">💡</span>
                            <p className="text-sm font-bold text-slate-600">Le tableau est vide</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">Ajoutez un post-it à l'aide de la barre ci-dessous.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Barre de contrôle flottante (Spawns Post-its) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-white/50 bg-[#f3f0ea] p-3 shadow-neu-flat select-none">
                <span className="text-[10px] font-bold text-slate-500 px-1 border-r border-[#dad7d1] pr-3 tracking-wider">
                    POST-ITS
                </span>
                
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => addPostIt("yellow")}
                        className="h-8 w-8 rounded-full bg-amber-100 border border-amber-300 shadow-neu-flat-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        title="Ajouter un Post-it jaune"
                    />
                    <button
                        type="button"
                        onClick={() => addPostIt("pink")}
                        className="h-8 w-8 rounded-full bg-rose-100 border border-rose-300 shadow-neu-flat-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        title="Ajouter un Post-it rose"
                    />
                    <button
                        type="button"
                        onClick={() => addPostIt("blue")}
                        className="h-8 w-8 rounded-full bg-sky-100 border border-sky-300 shadow-neu-flat-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        title="Ajouter un Post-it bleu"
                    />
                    <button
                        type="button"
                        onClick={() => addPostIt("green")}
                        className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-300 shadow-neu-flat-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        title="Ajouter un Post-it vert"
                    />
                </div>
            </div>

            {/* Panneau de discussion (Comments Drawer) */}
            {activeCommentPostIt && (
                <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l border-[#dad7d1] bg-[#f3f0ea] shadow-2xl transition-all duration-300 select-text">
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between border-b border-[#dad7d1]/50 px-4 py-3.5 bg-[#f3f0ea] select-none">
                        <div>
                            <h2 className="text-sm font-bold text-[#1b202e]">
                                Discussion sur l'idée
                            </h2>
                            <p className="text-[10px] text-slate-450 font-semibold truncate max-w-[280px] mt-0.5">
                                "{activeCommentPostIt.text || "Idée vide"}"
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeComments}
                            className="rounded-lg p-1 text-slate-400 hover:bg-[#dad7d1]/30 hover:text-slate-650 transition cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Drawer Body - Comments list with restricted height and custom scroll */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-10rem)] scroll-smooth pr-2">
                        {loadingComments ? (
                            <div className="flex h-32 items-center justify-center text-slate-450 text-xs font-semibold animate-pulse select-none">
                                Chargement des commentaires...
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="flex h-32 flex-col items-center justify-center text-slate-450 text-xs space-y-1 select-none font-medium">
                                <span className="text-xl mb-1">💬</span>
                                <span>Aucune discussion pour le moment.</span>
                                <span>Soyez le premier à commenter !</span>
                            </div>
                        ) : (
                            // Render only root comments. They will recursively render their children.
                            comments
                                .filter((c) => c.parentId === null)
                                .map((c) => renderCommentNode(c))
                        )}
                    </div>

                    {/* Drawer Footer - New comment input */}
                    <div className="border-t border-[#dad7d1]/50 p-4 bg-[#f3f0ea] shadow-neu-inset-sm">
                        {replyingToComment && (
                            <div className="mb-2 flex items-center justify-between rounded-lg bg-[#f3f0ea] border border-sky-200 px-2.5 py-1.5 text-xs text-sky-700 font-semibold shadow-neu-flat-sm select-none">
                                <span className="truncate max-w-[280px]">
                                    En réponse à <strong>@{replyingToComment.username}</strong>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setReplyingToComment(null)}
                                    className="text-[10px] font-bold text-sky-600 hover:text-sky-850 transition cursor-pointer"
                                >
                                    Annuler
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                                type="text"
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder={replyingToComment ? "Écrire une réponse..." : "Ajouter un commentaire..."}
                                className="flex-1 rounded-xl border border-[#dad7d1] bg-[#f3f0ea] px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#dad7d1]/80 shadow-neu-inset-sm font-medium"
                            />
                            <button
                                type="submit"
                                disabled={!newCommentText.trim()}
                                className="rounded-xl bg-[#1b202e] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#252c3f] disabled:opacity-50 disabled:cursor-not-allowed shadow-neu-flat-sm cursor-pointer"
                            >
                                Envoyer
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Panneau de Synthèse (Decisions Drawer) */}
            {isDecisionsDrawerOpen && (
                <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l border-[#dad7d1] bg-[#f3f0ea] shadow-2xl transition-all duration-300 select-text">
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between border-b border-[#dad7d1]/50 px-4 py-3.5 bg-[#f3f0ea] select-none">
                        <div>
                            <h2 className="text-sm font-bold text-[#1b202e] flex items-center gap-2">
                                📋 Synthèse & Décisions
                            </h2>
                            <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
                                Actions validées et idées écartées
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDecisionsDrawerOpen(false)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-[#dad7d1]/30 hover:text-slate-650 transition cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Drawer Body - Split into two sections */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 max-h-[calc(100vh-10rem)] scroll-smooth pr-2">
                        {/* Section 1: Ce qu'on fait */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 select-none">
                                🚀 Ce qu'on fait <span className="text-[10px] font-normal text-slate-450">({decisions.filter(d => d.decisionType === "DO").length})</span>
                            </h3>

                            {/* Add item input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newDoText}
                                    onChange={(e) => setNewDoText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            void handleAddDecision(newDoText, "DO");
                                        }
                                    }}
                                    placeholder="Ajouter une action..."
                                    className="flex-1 rounded-xl border border-[#dad7d1] bg-[#f3f0ea] px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#dad7d1]/80 shadow-neu-inset-sm font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddDecision(newDoText, "DO")}
                                    className="rounded-xl bg-[#1b202e] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#252c3f] shadow-neu-flat-sm cursor-pointer"
                                >
                                    Ajouter
                                </button>
                            </div>

                            {/* List of actions */}
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {decisions.filter(d => d.decisionType === "DO").map((decision) => {
                                    const hasLink = !!decision.ideaId;
                                    return (
                                        <div 
                                            key={decision.id} 
                                            onClick={() => hasLink && handleHighlightPostIt(decision.ideaId!)}
                                            className={`flex items-center justify-between gap-2 rounded-xl border border-emerald-250 bg-emerald-50/20 p-2.5 shadow-neu-flat-sm transition ${
                                                hasLink 
                                                    ? "cursor-pointer hover:bg-emerald-50/40 hover:shadow-neu-flat border-emerald-350" 
                                                    : "hover:shadow-neu-flat"
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="text-emerald-500 font-bold select-none">{hasLink ? "🔗" : "•"}</span>
                                                <span className="text-xs text-slate-750 font-medium break-words leading-relaxed">
                                                    {decision.content}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteDecision(decision.id);
                                                }}
                                                className="text-slate-400 hover:text-rose-600 transition p-1 text-xs cursor-pointer select-none"
                                                title="Supprimer la décision"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}

                                {decisions.filter(d => d.decisionType === "DO").length === 0 && (
                                    <p className="text-[11px] text-slate-450 text-center py-4 select-none font-medium">
                                        Aucune décision validée pour le moment.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-[#dad7d1]/60" />

                        {/* Section 2: Ce qu'on ne fait pas */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 select-none">
                                ❌ Ce qu'on ne fait pas <span className="text-[10px] font-normal text-slate-450">({decisions.filter(d => d.decisionType === "DONT").length})</span>
                            </h3>

                            {/* Add item input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newDontText}
                                    onChange={(e) => setNewDontText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            void handleAddDecision(newDontText, "DONT");
                                        }
                                    }}
                                    placeholder="Ajouter une idée écartée..."
                                    className="flex-1 rounded-xl border border-[#dad7d1] bg-[#f3f0ea] px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#dad7d1]/80 shadow-neu-inset-sm font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddDecision(newDontText, "DONT")}
                                    className="rounded-xl bg-[#1b202e] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#252c3f] shadow-neu-flat-sm cursor-pointer"
                                >
                                    Ajouter
                                </button>
                            </div>

                            {/* List of rejected ideas */}
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {decisions.filter(d => d.decisionType === "DONT").map((decision) => {
                                    const hasLink = !!decision.ideaId;
                                    return (
                                        <div 
                                            key={decision.id} 
                                            onClick={() => hasLink && handleHighlightPostIt(decision.ideaId!)}
                                            className={`flex items-center justify-between gap-2 rounded-xl border border-rose-250 bg-rose-50/20 p-2.5 shadow-neu-flat-sm transition ${
                                                hasLink 
                                                    ? "cursor-pointer hover:bg-rose-50/40 hover:shadow-neu-flat border-rose-350" 
                                                    : "hover:shadow-neu-flat"
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="text-rose-500 font-bold select-none">{hasLink ? "🔗" : "•"}</span>
                                                <span className="text-xs text-slate-750 font-medium break-words leading-relaxed line-through decoration-rose-300">
                                                    {decision.content}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteDecision(decision.id);
                                                }}
                                                className="text-slate-400 hover:text-rose-600 transition p-1 text-xs cursor-pointer select-none"
                                                title="Supprimer l'exclusion"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}

                                {decisions.filter(d => d.decisionType === "DONT").length === 0 && (
                                    <p className="text-[11px] text-slate-450 text-center py-4 select-none font-medium">
                                        Aucune idée écartée de la trace.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showSlidesOverlay && slides.length > 0 && (
                <div className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#f3f0ea] p-8 md:p-16 select-none animate-fadeIn">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#dad7d1]/50 pb-6">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📽️</span>
                            <div>
                                <h2 className="text-sm font-bold text-[#1b202e] uppercase tracking-[0.2em]">{sessionTitle}</h2>
                                <p className="text-xs text-slate-400">Présentation & Consignes</p>
                            </div>
                        </div>
                        <div className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-600 shadow-neu-flat-sm">
                            Slide {currentSlideIndex + 1} / {slides.length}
                        </div>
                    </div>

                    {/* Main Slide Content in Neumorphic Card */}
                    <div className="my-auto max-w-4xl mx-auto w-full rounded-[2.5rem] border border-white/40 bg-[#f3f0ea] p-8 md:p-12 shadow-neu-flat text-center space-y-6 transition-all duration-300">
                        <h1 className="text-3xl md:text-5xl font-black text-[#1b202e] tracking-tight leading-tight">
                            {slides[currentSlideIndex].title}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-650 leading-relaxed max-w-3xl mx-auto whitespace-pre-wrap">
                            {slides[currentSlideIndex].content}
                        </p>
                    </div>

                    {/* Controls Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#dad7d1]/50 pt-6">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={currentSlideIndex === 0}
                                onClick={() => setCurrentSlideIndex(prev => prev - 1)}
                                className="inline-flex items-center justify-center rounded-2xl border border-[#dad7d1] bg-[#f3f0ea] px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-neu-flat-sm transition hover:bg-[#dad7d1]/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                                ← Précédent
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSlidesOverlay(false)}
                                className="inline-flex items-center justify-center rounded-2xl border border-dashed border-[#dad7d1] bg-[#f3f0ea] px-6 py-3.5 text-sm font-semibold text-slate-500 shadow-neu-flat-sm transition hover:bg-[#dad7d1]/20 cursor-pointer"
                            >
                                Passer l&apos;introduction ✕
                            </button>
                        </div>

                        {currentSlideIndex < slides.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentSlideIndex(prev => prev + 1)}
                                className="inline-flex items-center justify-center rounded-2xl bg-[#1b202e] px-8 py-3.5 text-sm font-semibold text-white shadow-neu-flat-sm transition hover:bg-[#252c3f] active:scale-[0.98] cursor-pointer"
                            >
                                Suivant →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowSlidesOverlay(false)}
                                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-neu-flat-sm transition hover:bg-emerald-700 active:scale-[0.98] cursor-pointer"
                            >
                                Commencer le brainstorming 🚀
                            </button>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
