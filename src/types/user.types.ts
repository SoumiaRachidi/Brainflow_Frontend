export interface UserRegistrationData {
    username: string;
    email: string;
    password: string;
}

export type DashboardRole = "ADMIN" | "USER" | "ANIMATOR";

export interface AuthenticatedUser {
    id?: number;
    username?: string;
    email?: string;
    systemRole?: DashboardRole;
    [key: string]: unknown;
}

export interface DashboardStatCard {
    label: string;
    value: string;
    trend: string;
    tone: "sky" | "indigo" | "emerald" | "violet";
}

export interface AdminTableUser {
    name: string;
    email: string;
    role: DashboardRole;
    status: string;
    lastActive: string;
}

export interface BrainstormingSession {
    title: string;
    facilitator: string;
    time: string;
    duration: string;
    participants: number;
    status: string;
}

export interface DashboardMetric {
    label: string;
    value: string;
    trend: string;
    tone: "sky" | "indigo" | "emerald" | "violet";
}

export interface BrainstormingSessionApiResponse {
    id?: number;
    title?: string;
    facilitator?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    participantsCount?: number;
    status?: string;
    creatorEmail?: string;
    createdByUserId?: number;
    inviteToken?: string;
    [key: string]: unknown;
}

export interface DashboardMetricsApiResponse {
    sessionsCount?: number;
    activeUsersCount?: number;
    validatedSessionsRate?: number;
    openIssuesCount?: number;
    [key: string]: unknown;
}
