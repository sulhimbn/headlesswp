"use client"

import { memo, useState } from 'react'
import { SITE_URL } from '@/lib/api/config'

export type SocialPlatform = 'facebook' | 'twitter' | 'whatsapp' | 'copy'

interface SocialShareProps {
  title: string
  url: string
  className?: string
}

interface SharePlatform {
  name: string
  icon: 'facebook' | 'twitter' | 'whatsapp' | 'link' | 'check'
  getShareUrl: (title: string, url: string) => string
  color: string
}

const platforms: SharePlatform[] = [
  {
    name: 'Facebook',
    icon: 'facebook',
    color: 'hover:bg-[#1877F2]',
    getShareUrl: (title, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'Twitter',
    icon: 'twitter',
    color: 'hover:bg-[#1DA1F2]',
    getShareUrl: (title, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    icon: 'whatsapp',
    color: 'hover:bg-[#25D366]',
    getShareUrl: (title, url) => `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
  },
]

function SocialShareComponent({ title, url, className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`

  const handleShare = (platform: SharePlatform) => {
    const shareUrl = platform.getShareUrl(title, fullUrl)
    window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = fullUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {platforms.map((platform) => (
          <button
            key={platform.name}
            onClick={() => handleShare(platform)}
            className={`p-2 rounded-full bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text-secondary))] ${platform.color} transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2`}
            aria-label={`Bagikan ke ${platform.name}`}
            title={`Bagikan ke ${platform.name}`}
          >
            <SocialIcon type={platform.icon} />
          </button>
        ))}
        <button
          onClick={handleCopyLink}
          className={`p-2 rounded-full bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text-secondary))] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 ${
            copied 
              ? 'bg-[hsl(var(--color-success))] text-white' 
              : 'hover:bg-[hsl(var(--color-primary))] hover:text-white'
          }`}
          aria-label={copied ? 'Tautan disalin' : 'Salin tautan'}
          title={copied ? 'Tautan disalin' : 'Salin tautan'}
        >
          <SocialIcon type={copied ? 'check' : 'link'} />
        </button>
      </div>
    </div>
  )
}

function SocialIcon({ type }: { type: 'facebook' | 'twitter' | 'whatsapp' | 'link' | 'check' }) {
  const className = 'w-5 h-5'

  switch (type) {
    case 'facebook':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
        </svg>
      )
    case 'twitter':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      )
    case 'link':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    case 'check':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
  }
}

export default memo(SocialShareComponent)
