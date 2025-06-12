import {  } from '@tauri-apps/api'
import { useEffect } from 'react'
import * as shell from "@tauri-apps/plugin-shell"

const TauriExternalLinkHandler: React.FC = () => {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const closestLink = target.closest('a')

      if (!closestLink) {
        return
      }

      const href = closestLink.getAttribute('href')

      if (
        href &&
        ['http://', 'https://', 'mailto:', 'tel:'].some((v) =>
          href.startsWith(v),
        )
      ) {
        event.preventDefault()
        shell.open(href)
      }
    }

    document.documentElement.addEventListener('click', handleClick, true)

    return () => {
      document.documentElement.removeEventListener('click', handleClick, true)
    }
  }, [])

  return null
}

export default TauriExternalLinkHandler
