import Link from "next/link";

import { BrainFlowLogo } from "@/components/brand/brainflow-logo";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3f9_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <BrainFlowLogo href="/login" />
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                BrainFlow, une base claire pour piloter les brainstormings.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Accédez à un espace de travail structuré, moderne et sécurisé pour les équipes administratives et les utilisateurs.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                Se connecter
              </Link>
              <a href="#features" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
                Découvrir l&apos;expérience
              </a>
            </div>
          </div>

          <div id="features" className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/50">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">Collaboration en Temps Réel</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Travaillez en synergie avec votre équipe sur un tableau blanc interactif où chaque action apparaît instantanément.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/50">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">Engagement Actif</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Participez facilement grâce aux post-its numériques, aux commentaires et à un système de vote intuitif.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/50">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">Espace Structuré</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Regroupez vos idées, priorisez les tâches et passez rapidement de la phase de réflexion à la prise de décision.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/50">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">Mémoire Collective</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Ne perdez aucune idée. Sauvegardez l&apos;historique complet de vos sessions et exportez vos résultats en un clic.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
