"use client";

import { useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SessionsManager } from "@/components/sessions/SessionsManager";
import type { AuthenticatedUser } from "@/types/user.types";

const sidebarItems = [
    {
        id: "sessions",
        label: "Mes Sessions",
        description: "Parcourez et rejoignez vos brainstormings.",
        href: "#sessions-manager",
        tone: "sky" as const,
    },
    {
        id: "collaboration",
        label: "Collaboration",
        description: "Participez aux ateliers en temps réel.",
        href: "#sessions-manager",
        tone: "indigo" as const,
    },
    {
        id: "api-loading",
        label: "Chargement API",
        description: "Les données viennent du backend.",
        href: "#sessions-manager",
        tone: "emerald" as const,
    },
    {
        id: "profile",
        label: "Profil",
        description: "Email et rôle affichés dynamiquement.",
        href: "#sessions-manager",
        tone: "violet" as const,
    },
];

export default function UserDashboardPage() {
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);

    return (
        <DashboardShell
            requiredRole="USER"
            title="Espace utilisateur BrainFlow"
            subtitle="Une interface concentrée sur les sessions de brainstorming, avec des appels à l&apos;action clairs et une lecture rapide des ateliers disponibles."
            sidebarItems={sidebarItems}
            onUserLoaded={setCurrentUser}
        >
            <div id="sessions-manager">
                <SessionsManager currentUser={currentUser} />
            </div>
        </DashboardShell>
    );
}
