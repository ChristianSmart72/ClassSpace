type Props = {
  size?: number
  width?: number
  height?: number
  className?: string
}

export function Logo({ size, width, height, className }: Props) {
  const px = size ?? width ?? height ?? 28
  return <span className={className} style={{ fontSize: px, lineHeight: 1 }}>📚</span>
}

export function LogoSplash({ size = 44 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span style={{ fontSize: size, lineHeight: 1 }}>📚</span>
      <p className="font-jakarta font-extrabold text-[10px] tracking-[0.28em] uppercase text-app-accent opacity-90">
        ClassSpace
      </p>
      <div className="w-5 h-5 border-2 border-app-accent border-t-transparent rounded-full animate-spin opacity-60" />
    </div>
  )
}
