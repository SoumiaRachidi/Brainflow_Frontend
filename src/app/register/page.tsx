"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { UserRegistrationData } from "@/types/user.types";
import { BrainFlowLogo } from "@/components/brand/brainflow-logo";

const initialFormData: UserRegistrationData = {
    username: "",
    email: "",
    password: "",
};

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<UserRegistrationData>(initialFormData);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        setIsSubmitting(true);

        try {
            const response = await fetch("http://localhost:8080/api/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.status === 201) {
                setSuccessMessage("Inscription réussie. Redirection vers la connexion...");
                setFormData(initialFormData);
                setTimeout(() => {
                    router.push("/login");
                }, 1200);
                return;
            }

            let backendMessage = "Une erreur est survenue lors de l'inscription.";

            try {
                const errorPayload: unknown = await response.json();

                if (
                    typeof errorPayload === "object" &&
                    errorPayload !== null &&
                    "message" in errorPayload &&
                    typeof (errorPayload as { message?: unknown }).message === "string"
                ) {
                    backendMessage = (errorPayload as { message: string }).message;
                }
            } catch {
                const textMessage = await response.text();
                if (textMessage) {
                    backendMessage = textMessage;
                }
            }

            if (!response.ok || response.status === 400) {
                setErrorMessage(backendMessage);
                return;
            }

            setErrorMessage(backendMessage);
        } catch {
            setErrorMessage("Impossible de contacter le serveur.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3f9_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
            <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_1.1fr]">
                <div className="flex flex-col justify-between bg-slate-50 p-8 sm:p-10">
                    <BrainFlowLogo href="/" />
                    <div className="my-auto space-y-4 py-8">
                        <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                            Rejoignez l&apos;expérience BrainFlow.
                        </h1>
                        <p className="max-w-xl text-lg leading-8 text-slate-600">
                            Créez votre compte pour organiser des sessions de brainstorming structurées et collaborer efficacement avec votre équipe.
                        </p>
                    </div>
                    <div className="text-xs text-slate-400">
                        © BrainFlow. Collaboration &amp; brainstorming en temps réel.
                    </div>
                </div>

                <div className="flex items-center justify-center p-8 sm:p-10">
                    <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
                        <div className="space-y-3 text-center">
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">S&apos;inscrire</h2>
                            <p className="text-sm text-slate-500">Créez votre compte pour commencer à collaborer.</p>
                        </div>

                        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700" htmlFor="username">
                                    Nom complet
                                </label>
                                <input
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Ex. Jean Dupont"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="vous@entreprise.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                                    Mot de passe
                                </label>
                                <input
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Créer un mot de passe"
                                    required
                                />
                            </div>

                            {errorMessage ? (
                                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {errorMessage}
                                </p>
                            ) : null}

                            {successMessage ? (
                                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                    {successMessage}
                                </p>
                            ) : null}

                            <button
                                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Inscription en cours..." : "S'inscrire"}
                            </button>

                            <div className="pt-2 text-center text-sm text-slate-600">
                                Vous avez déjà un compte ?{" "}
                                <Link href="/login" className="font-semibold text-slate-900 transition hover:text-sky-600 hover:underline">
                                    Connectez-vous
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}
