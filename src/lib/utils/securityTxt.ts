export function getSecurityTxtContent(): string {
  const contact = process.env.SECURITY_TXT_CONTACT || 'security@mitrabantennews.com'
  const encryption = process.env.SECURITY_TXT_ENCRYPTION || ''
  const languages = process.env.SECURITY_TXT_LANGUAGES || 'en'
  const policy = process.env.SECURITY_TXT_POLICY || ''
  const expires = process.env.SECURITY_TXT_EXPIRES || ''

  const lines: string[] = [`Contact: ${contact}`]

  if (encryption) {
    lines.push(`Encryption: ${encryption}`)
  }

  lines.push(`Preferred-Languages: ${languages}`)

  if (policy) {
    lines.push(`Policy: ${policy}`)
  }

  if (expires) {
    lines.push(`Expires: ${expires}`)
  }

  return lines.join('\n') + '\n'
}