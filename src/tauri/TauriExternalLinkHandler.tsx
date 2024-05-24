import { shell } from '@tauri-apps/api'
import { useEffect } from 'react'

const TauriExternalLinkHandler: React.FC = () => {
  useEffect(() => {
    document.documentElement.addEventListener('click', (event) => {
      const target = event.target

      if (!(target instanceof HTMLElement)) {
        return
      }

      if (target.tagName === 'A') {
        const href = target.getAttribute('href')

        if (href?.startsWith('http')) {
          event.preventDefault()
          shell.open(href)
        }
      }
    })
  }, [])

  return null
}

export default TauriExternalLinkHandler
