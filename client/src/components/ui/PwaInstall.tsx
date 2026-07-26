import { useEffect, useState } from 'react'

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') setDeferredPrompt(null)
  }

  if (!deferredPrompt) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-app-surface border border-app-border rounded-2xl px-4 py-3 shadow-xl max-w-[320px] w-[90%]">
      <span className="text-xl">📚</span>
      <div className="flex-1 min-w-0">
        <p className="text-app-text font-jakarta font-semibold text-xs">Install ClassSpace</p>
        <p className="text-app-text-faint text-[10px] font-inter">Add to home screen for quick access</p>
      </div>
      <button
        onClick={install}
        className="bg-app-accent text-app-bg font-jakarta font-bold text-xs rounded-xl px-4 py-2 active:scale-95 transition-all"
      >
        Install
      </button>
      <button
        onClick={() => setDeferredPrompt(null)}
        className="text-app-text-faint text-sm p-1"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  )
}
