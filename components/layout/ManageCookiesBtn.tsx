'use client'

export function ManageCookiesBtn() {
  function reset() {
    document.cookie = 'dt-consent=; max-age=0; path=/'
    window.location.reload()
  }
  return (
    <button onClick={reset} className="hover:text-white/60 transition-colors">
      Cookies
    </button>
  )
}
