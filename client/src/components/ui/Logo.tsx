import type { ImgHTMLAttributes } from 'react'

export function Logo(props: Partial<ImgHTMLAttributes<HTMLImageElement>>) {
  return (
    <img
      src="/logo.svg"
      alt="ClassSpace"
      width={28}
      height={28}
      {...props}
    />
  )
}

export function LogoSplash({ size = 44 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src="/logo.svg"
        alt="ClassSpace"
        width={size}
        height={size}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(232,255,71,0.15))' }}
      />
      <p className="font-jakarta font-extrabold text-[10px] tracking-[0.28em] uppercase text-app-accent opacity-90">
        ClassSpace
      </p>
      <div className="w-5 h-5 border-2 border-app-accent border-t-transparent rounded-full animate-spin opacity-60" />
    </div>
  )
}
