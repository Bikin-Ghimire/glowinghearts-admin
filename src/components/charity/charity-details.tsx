'use client'

import { useMemo } from 'react'

type Charity = {
  Txt_CharityDesc?: string
  VC_ContactFirstName?: string
  VC_ContactLastName?: string
  VC_ContactEmail?: string
  VC_ContactPhone?: string
}

function sanitizeForDark(html: string | undefined) {
  if (!html) return ''
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')

    // Remove inline colors/backgrounds that fight dark mode
    doc.body.querySelectorAll<HTMLElement>('*').forEach((el) => {
      // Remove deprecated <font color="...">
      if (el.tagName.toLowerCase() === 'font' && el.hasAttribute('color')) {
        el.removeAttribute('color')
      }

      // Strip color/background from style attribute, keep other styles intact
      const style = el.getAttribute('style')
      if (style) {
        // Create a CSSStyleDeclaration by applying to a temp element
        const tmp = document.createElement('div')
        tmp.setAttribute('style', style)

        tmp.style.removeProperty('color')
        tmp.style.removeProperty('background')
        tmp.style.removeProperty('background-color')

        // Also kill obvious black/white fallbacks embedded as !important etc.
        const cleaned = tmp.getAttribute('style') || ''
          .replace(/(^|;)\s*color\s*:\s*[^;!]+!?\s*important?\s*/gi, '')
          .replace(/(^|;)\s*background(-color)?\s*:\s*[^;!]+!?\s*important?\s*/gi, '')
          .trim()

        if (cleaned) el.setAttribute('style', cleaned)
        else el.removeAttribute('style')
      }
    })

    return doc.body.innerHTML
  } catch {
    // On any parsing error, fall back to raw HTML
    return html
  }
}

export function CharityDetails({ charity }: { charity: Charity }) {
  const cleanedHtml = useMemo(
    () => sanitizeForDark(charity.Txt_CharityDesc),
    [charity.Txt_CharityDesc]
  )

  return (
    <>
      {/* Dark-mode polish for rich content */}
      <style jsx global>{`
        .dark .prose a { color: #93c5fd; }
        .dark .prose a:hover { color: #bfdbfe; }
        .dark .prose code {
          color: #e4e4e7;
          background: #18181b;
        }
        .dark .prose pre {
          background: #0a0a0a;
          color: #f4f4f5;
          border: 1px solid #3f3f46;
        }
        .dark .prose blockquote {
          color: #d4d4d8;
          border-left-color: #52525b;
        }
        .dark .prose hr { border-color: #3f3f46; }
        .dark .prose table { border-color: #3f3f46; }
        .dark .prose thead th {
          color: #e4e4e7;
          border-bottom-color: #3f3f46;
        }
        .dark .prose tbody td { border-bottom-color: #27272a; }
      `}</style>

      <div className="mt-8">
        <dl className="grid grid-cols-1 sm:grid-cols-2">
          {/* About */}
          <div className="border-t border-zinc-200 px-4 py-6 sm:col-span-2 sm:px-0 dark:border-zinc-700">
            <dt className="text-lg/6 font-medium text-zinc-900 dark:text-zinc-100">About</dt>
            <dd className="mt-1 text-sm/6 text-zinc-700 sm:mt-2 dark:text-zinc-200">
              <article
                className="
                  prose prose-sm prose-zinc max-w-none
                  prose-a:underline prose-img:rounded prose-pre:rounded
                  dark:prose-invert
                "
              >
                {/* If this HTML is untrusted, consider server-side sanitization too */}
                <div dangerouslySetInnerHTML={{ __html: cleanedHtml }} />
              </article>
            </dd>
          </div>

          {/* Section header */}
          <div className="px-4 py-6 sm:col-span-2 sm:px-0">
            <dt className="text-lg/6 font-medium text-zinc-900 dark:text-zinc-100">Charity Personnel</dt>
          </div>

          <div className="border-t border-zinc-200 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-zinc-700">
            <dt className="text-sm/6 font-medium text-zinc-900 dark:text-zinc-100">First Name</dt>
            <dd className="mt-1 text-sm/6 text-zinc-700 dark:text-zinc-200">
              {charity.VC_ContactFirstName || 'No name available.'}
            </dd>
          </div>

          <div className="border-t border-zinc-200 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-zinc-700">
            <dt className="text-sm/6 font-medium text-zinc-900 dark:text-zinc-100">Last Name</dt>
            <dd className="mt-1 text-sm/6 text-zinc-700 dark:text-zinc-200">
              {charity.VC_ContactLastName || 'No last name available.'}
            </dd>
          </div>

          <div className="border-t border-zinc-200 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-zinc-700">
            <dt className="text-sm/6 font-medium text-zinc-900 dark:text-zinc-100">Email address</dt>
            <dd className="mt-1 text-sm/6 text-zinc-700 dark:text-zinc-200">
              {charity.VC_ContactEmail || 'No email available.'}
            </dd>
          </div>

          <div className="border-t border-zinc-200 px-4 py-6 sm:col-span-1 sm:px-0 dark:border-zinc-700">
            <dt className="text-sm/6 font-medium text-zinc-900 dark:text-zinc-100">Phone Number</dt>
            <dd className="mt-1 text-sm/6 text-zinc-700 dark:text-zinc-200">
              {charity.VC_ContactPhone || 'No phone number available.'}
            </dd>
          </div>
        </dl>
      </div>
    </>
  )
}