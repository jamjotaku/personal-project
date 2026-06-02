'use client'

import { useFormStatus } from 'react-dom'
import styles from './MentalForm.module.css'

function SubmitButton({ level }: { level: number }) {
  const { pending } = useFormStatus()
  return (
    <button 
      name="level" 
      value={level} 
      type="submit" 
      disabled={pending}
      className={styles.button}
    >
      {level}
    </button>
  )
}

export default function MentalForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <div>
      <form action={action} className={styles.form}>
        {[1, 2, 3, 4, 5].map((level) => (
          <SubmitButton key={level} level={level} />
        ))}
      </form>
      <div className={styles.statusText}>
        <StatusMessage />
      </div>
    </div>
  )
}

function StatusMessage() {
  const { pending } = useFormStatus()
  return <>{pending ? '記録中...' : ''}</>
}
