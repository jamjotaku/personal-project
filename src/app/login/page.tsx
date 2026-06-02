import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)', padding: '32px', borderRadius: '16px', minWidth: '300px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--text-primary)' }}>Portal Login</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="email" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input id="email" name="email" type="email" required style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="password" style={{ color: 'var(--text-secondary)' }}>Password</label>
          <input id="password" name="password" type="password" required style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button formAction={login} style={{ flex: 1, padding: '10px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Log In</button>
          <button formAction={signup} style={{ flex: 1, padding: '10px', background: 'transparent', color: 'var(--accent-color)', border: '1px solid var(--accent-color)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Sign Up</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '8px' }}>初回は「Sign Up」で登録してください</p>
      </form>
    </div>
  )
}
