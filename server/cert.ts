/**
 * server/cert.ts
 *
 * Loads a self-signed TLS cert from certs/, generating one on first boot if missing.
 * Self-signed means browsers show a one-time "untrusted certificate" warning — acceptable
 * for a trusted LAN. The certs/ dir is gitignored; the key never leaves the host.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import selfsigned from 'selfsigned'

const here = dirname(fileURLToPath(import.meta.url))
const certDir = resolve(here, '../certs')
const keyPath = resolve(certDir, 'key.pem')
const certPath = resolve(certDir, 'cert.pem')

export async function loadOrCreateCert(): Promise<{ key: string; cert: string }> {
  if (existsSync(keyPath) && existsSync(certPath)) {
    return { key: readFileSync(keyPath, 'utf-8'), cert: readFileSync(certPath, 'utf-8') }
  }

  console.log('No TLS cert found — generating a self-signed certificate in certs/ ...')
  const attrs = [{ name: 'commonName', value: 'marian-apparitions.local' }]
  const tenYears = new Date()
  tenYears.setFullYear(tenYears.getFullYear() + 10)
  const pems = await selfsigned.generate(attrs, { notAfterDate: tenYears, keySize: 2048 })

  mkdirSync(certDir, { recursive: true })
  writeFileSync(keyPath, pems.private, { mode: 0o600 })
  writeFileSync(certPath, pems.cert, { mode: 0o600 })

  return { key: pems.private, cert: pems.cert }
}
