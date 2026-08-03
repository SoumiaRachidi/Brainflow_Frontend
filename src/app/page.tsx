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
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sécurité</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Connexion par token et contrôle de rôle après authentification.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Structure</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Tableaux de bord séparés, lisibles et pensés pour l&apos;usage métier.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Design</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Interface blanche, aérienne, avec accents bleus sobres.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Action</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">Logo interactif et navigation rapide vers les espaces protégés.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
