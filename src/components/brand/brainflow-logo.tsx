import Link from "next/link";

type BrainFlowLogoProps = {
    compact?: boolean;
    href?: string;
    className?: string;
};

export function BrainFlowLogo({ compact = false, href = "/", className = "" }: BrainFlowLogoProps) {
    const content = (
        <span className={`group inline-flex items-center gap-3 ${className}`}>
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/50 bg-[#f3f0ea] shadow-neu-flat-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-neu-flat">
                <img src="/2.png" alt="BrainFlow Logo" className="h-full w-full object-cover" />
            </span>

            {!compact ? (
                <span className="leading-tight select-none">
                    <span className="block text-sm font-bold tracking-[0.28em] text-[#1b202e] uppercase">BrainFlow</span>
                    <span className="block text-[10px] font-medium text-slate-500">Structured brainstorming</span>
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