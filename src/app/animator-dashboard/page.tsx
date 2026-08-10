"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SessionsManager } from "@/components/sessions/SessionsManager";
import type { AuthenticatedUser } from "@/types/user.types";

const sidebarItems = [
    {
        id: "overview",
        label: "Vue d'ensemble",
        description: "Suivez vos sessions actives.",
        href: "#sessions-manager-section",
        tone: "sky" as const,
    },
    {
        id: "sessions",
        label: "Mes sessions",
        description: "Gérez vos ateliers de brainstorming.",
        href: "#sessions-manager-section",
        tone: "indigo" as const,
    },
];

export default function AnimatorDashboardPage() {
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);

    return (
        <DashboardShell
            requiredRole="ANIMATOR"
            title="Espace de pilotage Animateur"
            subtitle="Gérez, animez et supervisez vos sessions de brainstorming en direct avec vos équipes."
            sidebarItems={sidebarItems}
            onUserLoaded={setCurrentUser}
        >
            <div className="space-y-8 text-slate-800" id="sessions-manager-section">
                <SessionsManager currentUser={currentUser} />
            </div>
        </DashboardShell>
    );
}
