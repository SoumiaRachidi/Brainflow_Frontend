import Link from "next/link";

type BrainFlowLogoProps = {
    compact?: boolean;
    href?: string;
    className?: string;
};

export function BrainFlowLogo({ compact = false, href = "/", className = "" }: BrainFlowLogoProps) {
    const content = (
        <span className={`group inline-flex items-center gap-3 ${className}`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-white text-sky-700 shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
                <svg viewBox="0 0 64 64" className="h-8 w-8" fill="none" aria-hidden="true">
                    <path
                        d="M20 46c-5.5-3.8-9-9.5-9-16.2C11 19.2 18.9 12 29 12c9.1 0 16.6 5.5 19.2 13.2"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                    />
                    <path
                        d="M26 44c-2-2.4-3.2-5.4-3.2-8.7 0-7.2 5.6-13.3 12.5-13.3s12.5 6 12.5 13.3c0 3.2-1.2 6.2-3.2 8.6"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M33 21c2.3 3.7 5.9 5.5 10.5 5.9"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                    />
                    <path
                        d="M36 22.5c-2.6 2.5-4 5.4-4 8.7v2.2"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                    />
                    <path
                        d="M28 40.2h12"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                    />
                    <path
                        d="M29 46h10"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                    />
                    <path
                        d="M24 8v6M40 8v6M11 20l5 2.5M53 20l-5 2.5M8 34h6M50 34h6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </span>

            {!compact ? (
                <span className="leading-tight">
                    <span className="block text-sm font-semibold tracking-[0.28em] text-slate-900 uppercase">BrainFlow</span>
                    <span className="block text-xs font-medium text-slate-500">Structured brainstorming dashboards</span>
                </span>
            ) : null}
        </span>
    );

    if (!href) {
        return content;
    }

    return (
        <Link href={href} className="inline-flex max-w-full items-center">
            {content}
        </Link>
    );
}