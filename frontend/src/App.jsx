import React, { useState, useCallback } from 'react'
import InputForm from './components/InputForm.jsx'
import GeneratingView from './components/GeneratingView.jsx'
import PRDView from './components/PRDView.jsx'

export default function App() {
  const [view, setView]       = useState('input')
  const [stages, setStages]   = useState([])
  const [prd, setPrd]         = useState(null)
  const [error, setError]     = useState(null)

  const handleGenerate = useCallback(async (formData) => {
    setError(null)
    setStages([])
    setPrd(null)
    setView('generating')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Generation failed')
      }

      // Read the SSE stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            setStages(prev => [...prev, event])

            if (event.stage === 'done') {
              setPrd(event.data)
              setView('prd')
            }
            if (event.stage === 'error') {
              throw new Error(event.message)
            }
          } catch (parseErr) {
            // ignore malformed events
          }
        }
      }
    } catch (e) {
      setError(e.message)
      setView('input')
    }
  }, [])

  const handleRefine = useCallback(async (instruction) => {
    if (!prd) return
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prd, instruction }),
      })
      if (!res.ok) throw new Error('Refinement failed')
      const updated = await res.json()
      setPrd(updated)
    } catch (e) {
      setError(e.message)
    }
  }, [prd])

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{
        background: 'var(--navy)', color: '#fff', padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, background: 'var(--purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>✦</div>
          <span style={{ fontWeight: 600, fontSize: 16 }}>PM Spec Generator</span>
          <span style={{ fontSize: 12, opacity: .5 }}>MVP v1.0</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, opacity: .7 }}>
          <span>Claude API</span><span>·</span>
          <span>Web Search</span><span>·</span>
          <span>Instructor</span>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {error && (
          <div style={{
            background: 'var(--coral-light)', border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20,
            color: 'var(--coral)', fontSize: 14, display: 'flex', gap: 8,
          }}>
            <span>⚠</span> {error}
            <button onClick={() => setError(null)} style={{
              marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--coral)', fontSize: 16,
            }}>×</button>
          </div>
        )}

        {view === 'input'      && <InputForm onSubmit={handleGenerate} />}
        {view === 'generating' && <GeneratingView stages={stages} />}
        {view === 'prd'        && prd && (
          <PRDView
            prd={prd}
            onRefine={handleRefine}
            onReset={() => { setPrd(null); setView('input') }}
          />
        )}
      </main>
    </div>
  )
}
