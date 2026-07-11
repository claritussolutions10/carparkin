import { useEffect } from 'react'

function upsertMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// No react-helmet in this app - this is the whole per-page SEO surface:
// title, meta description, and canonical link, set directly on mount.
export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    upsertMeta('description', description)
    upsertCanonical(window.location.origin + window.location.pathname)
  }, [title, description])
}
