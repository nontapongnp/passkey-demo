'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { explainWebAuthnError, postJSON } from '@/lib/client'
import { LoadingOverlay } from '@/components/LoadingOverlay'

export function LoginForm() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [redirecting, setRedirecting] = useState(false)

  async function loginWithPasskey(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!browserSupportsWebAuthn()) {
      setError('เบราว์เซอร์นี้ไม่รองรับ Passkey')
      return
    }
    setBusy(true)
    try {
      // 1) ส่งอีเมล → server ออก challenge + รายการ Passkey ของบัญชีนี้
      const opt = await postJSON('/api/login/options', { email })
      if (!opt.ok) return setError(opt.data.error ?? 'เริ่มเข้าสู่ระบบไม่สำเร็จ')

      // 2) ปลดล็อกอุปกรณ์ → เซ็น challenge ด้วย private key (key ไม่ออกจากเครื่อง)
      let assertion
      try {
        assertion = await startAuthentication({ optionsJSON: opt.data })
      } catch (err) {
        return setError(explainWebAuthnError(err))
      }

      // 3) ส่งแค่ลายเซ็นกลับไปให้ server ตรวจด้วย public key
      const ver = await postJSON('/api/login/verify', assertion)
      if (!ver.ok) return setError(ver.data.error ?? 'เข้าสู่ระบบไม่สำเร็จ')

      setRedirecting(true)
      router.push('/profile')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function loginWithRecovery(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) return setError('กรอกอีเมลด้านบนก่อน')
    setBusy(true)
    try {
      const res = await postJSON('/api/login/recovery', { email, code })
      if (!res.ok) return setError(res.data.error ?? 'เข้าสู่ระบบไม่สำเร็จ')
      setRedirecting(true)
      router.push('/profile')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {redirecting && <LoadingOverlay text="กำลังเข้าสู่ระบบ…" />}
      <div className="card">
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={loginWithPasskey}>
          <div className="field">
            <label htmlFor="email">อีเมล</label>
            <input
              id="email"
              type="email"
              autoComplete="username webauthn"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn" disabled={busy}>
            {busy ? 'รอยืนยันบนอุปกรณ์…' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <details>
          <summary>ไม่มีอุปกรณ์ที่มี Passkey ? ใช้ Recovery Code</summary>
          <form onSubmit={loginWithRecovery}>
            <div className="field">
              <label htmlFor="r-code">Recovery Code</label>
              <input
                id="r-code"
                type="text"
                required
                placeholder="xxxxxx-xxxxxx"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button className="btn secondary" disabled={busy}>
              เข้าสู่ระบบด้วย Recovery Code
            </button>
          </form>
        </details>
      </div>

      <p className="foot">
        ยังไม่มีบัญชี ? <a href="/register">สร้างบัญชี</a>
      </p>
    </>
  )
}
