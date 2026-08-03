"use client";

import { useState } from "react";
import type { UserRegistrationData } from "@/types/user.types";

const initialFormData: UserRegistrationData = {
    username: "",
    email: "",
    password: "",
};

export default function RegisterPage() {
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
                setSuccessMessage("Inscription réussie.");
                setFormData(initialFormData);
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
        <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100 sm:px-6 lg:px-8">
            <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-white">
                        Créer un compte
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Renseignez vos informations pour rejoindre BrainFlow.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-200" htmlFor="username">
                            Username
                        </label>
                        <input
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Votre nom d'utilisateur"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-200" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
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
                        <label className="text-sm font-medium text-zinc-200" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Choisissez un mot de passe"
                            required
                        />
                    </div>

                    {errorMessage ? (
                        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {errorMessage}
                        </p>
                    ) : null}

                    {successMessage ? (
                        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                            {successMessage}
                        </p>
                    ) : null}

                    <button
                        className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Envoi en cours..." : "S'inscrire"}
                    </button>
                </form>
            </section>
        </main>
    );
}
