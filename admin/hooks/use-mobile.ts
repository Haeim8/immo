import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialiser à false pour éviter le mismatch SSR/client
  const [isMobile, setIsMobile] = React.useState(false)
  const [hasHydrated, setHasHydrated] = React.useState(false)

  React.useEffect(() => {
    // Marquer comme hydraté
    setHasHydrated(true)

    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Check initial
    checkMobile()

    // Écouter les changements
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkMobile)

    return () => mql.removeEventListener("change", checkMobile)
  }, [])

  // Retourner false tant que pas hydraté pour éviter les re-renders
  return hasHydrated ? isMobile : false
}
