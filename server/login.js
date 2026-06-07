const form = document.getElementById('login-form')
const input = document.getElementById('password')
const button = document.getElementById('submit')
const errorEl = document.getElementById('error')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorEl.textContent = ''
  button.disabled = true
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: input.value }),
    })
    if (res.ok) {
      window.location.href = '/'
      return
    }
    const data = await res.json().catch(() => ({}))
    errorEl.textContent = data.error || 'Sign in failed.'
  } catch {
    errorEl.textContent = 'Network error. Please try again.'
  } finally {
    button.disabled = false
    input.select()
  }
})
