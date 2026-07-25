import type { SVGProps } from 'react'

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Book 1 (bottom, largest) */}
      <rect x="3" y="14" width="22" height="12" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="3" y="14" width="22" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5" />
      {/* Book 2 (middle) */}
      <rect x="4.5" y="9" width="19" height="11" rx="1.8" fill="currentColor" opacity="0.5" />
      <rect x="4.5" y="9" width="19" height="11" rx="1.8" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.7" />
      {/* Book 3 (top, accent) */}
      <rect x="6" y="4" width="16" height="10" rx="1.8" fill="currentColor" opacity="0.9" />
      <rect x="6" y="4" width="16" height="10" rx="1.8" stroke="currentColor" strokeWidth="1.2" fill="none" />
      {/* Book 3 spine line */}
      <line x1="14" y1="4" x2="14" y2="14" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      {/* Book 2 spine line */}
      <line x1="14" y1="9" x2="14" y2="20" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
      {/* Book 1 spine line */}
      <line x1="14" y1="14" x2="14" y2="26" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      {/* Page lines on top book */}
      <line x1="9" y1="7.5" x2="19" y2="7.5" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
      <line x1="9" y1="9.5" x2="19" y2="9.5" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
    </svg>
  )
}

export function LogoSplash({ size = 48 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Logo
        width={size}
        height={size}
        className="text-app-accent"
      />
      <p className="font-jakarta font-extrabold text-[10px] tracking-[0.28em] uppercase text-app-accent opacity-90">
        ClassSpace
      </p>
      <div className="w-5 h-5 border-2 border-app-accent border-t-transparent rounded-full animate-spin opacity-60" />
    </div>
  )
}
