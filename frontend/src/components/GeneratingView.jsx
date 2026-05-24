import React, { useState, useEffect, useRef } from 'react'

const STAGE_META = {
  researching:      { icon: '🔍', label: 'Searching the web for competitive context', color: 'var(--blue)',   bg: 'var(--blue-light)' },
  research_done:    { icon: '✅', label: 'Web research complete',                      color: 'var(--green)',  bg: 'var(--green-light)' },
  research_skipped: { icon: '⏭', label: 'Web research skipped',                       color: 'var(--gray-500)', bg: 'var(--gray-100)' },
  research_error:   { icon: '⚠', label: 'Research unavailable — continuing',          color: 'var(--amber)',  bg: 'var(--amber-light)' },
  writing:          { icon: '✍', label: 'Writing PRD with Claude + Instructor',        color: 'var(--purple)', bg: 'var(--purple-light)' },
  done:             { icon: '✦', label: 'PRD complete!',                               color: 'var(--green)',  bg: 'var(--green-light)' },
  error:            { icon: '✕', label: 'Error occurred',                              color: 'var(--coral)',  bg: 'var(--coral-light)' },
}

const PIPELINE = [
  { stage: 'researching', label: 'Web research',        sub: 'Claude web_search tool use' },
  { stage: 'writing',     label: 'Spec writing',        sub: 'Instructor + Pydantic schema' },
  { stage: 'done',        label: 'PRD complete',        sub: 'Structured output validated' },
]

function useTimer(running) {
  const [elapsed, setElapsed] = useState(0)
  const start = useRef(Date.now())
  useEffect(() => {
    if (!running) return
    start.current = Date.now()
    const id = setInterval(() => setElapsed(Date.now() - start.current), 100)
    return () => clearInterval(id)
  }, [running])
  const s = Math.floor(elapsed / 1000)
  const ms = String(Math.floor((elapsed % 1000) / 100))
  return `${s}.${ms}s`
}

export default function GeneratingView({ stages }) {
  const latest   = stages[stages.length - 1]
  const isDone   = latest?.stage === 'done'
  const isError  = latest?.stage === 'error'
  const running  = stages.length > 0 && !isDone && !isError
  const timer    = useTimer(true)

  // Track when each stage started
  const stageTimes = useRef({})
  useEffect(() => {
    if (latest && !stageTimes.current[latest.stage]) {
      stageTimes.current[latest.stage] = Date.now()
    }
  }, [latest])

  const activeStage = latest?.stage || 'connecting'
  const activeMeta  = STAGE_META[activeStage] || { icon: '…', color: 'var(--gray-500)', bg: 'var(--gray-100)' }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 32 }}>

      {/* Header with live timer */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', margin: '0 auto 16px',
          background: activeMeta.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          transition: 'background .4s',
        }}>
          {activeMeta.icon}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
          {isDone ? 'PRD ready!' : isError ? 'Something went wrong' : 'Generating your PRD…'}
        </h2>

        {/* Timer */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: isDone ? 'var(--green-light)' : 'var(--gray-100)',
          borderRadius: 99, padding: '5px 14px', marginTop: 4,
          transition: 'background .4s',
        }}>
          <span style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {isDone ? 'Completed in' : 'Elapsed'}
          </span>
          <span style={{
            fontSize: 20, fontWeight: 700, fontFamily: 'monospace',
            color: isDone ? 'var(--green)' : 'var(--navy)',
          }}>
            {timer}
          </span>
        </div>
      </div>

      {/* Pipeline progress bar */}
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)', padding: '16px 20px',
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 0,
      }}>
        {PIPELINE.map((step, i) => {
          const fired    = stages.some(s => s.stage === step.stage || (step.stage === 'writing' && s.stage === 'writing'))
          const isActive = activeStage === step.stage || (step.stage === 'writing' && activeStage === 'writing')
          const isDoneStep = isDone || (i === 0 && stages.some(s => ['research_done','research_skipped','research_error','writing'].includes(s.stage)))
                          || (i === 1 && isDone)
          return (
            <React.Fragment key={step.stage}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', margin: '0 auto 6px',
                  background: isDoneStep || fired ? (isActive ? activeMeta.bg : 'var(--green-light)') : 'var(--gray-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  border: isActive ? `2px solid ${activeMeta.color}` : '2px solid transparent',
                  transition: 'all .3s',
                }}>
                  {isDoneStep && !isActive ? '✓' : STAGE_META[step.stage]?.icon || '○'}
                </div>
                <p style={{ fontSize: 12, fontWeight: 500, color: isActive ? activeMeta.color : fired || isDoneStep ? 'var(--green)' : 'var(--gray-500)', marginBottom: 2 }}>
                  {step.label}
                </p>
                <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>{step.sub}</p>
              </div>
              {i < PIPELINE.length - 1 && (
                <div style={{
                  width: 40, height: 2, flexShrink: 0, marginBottom: 28,
                  background: fired || isDoneStep ? 'var(--green)' : 'var(--gray-200)',
                  transition: 'background .4s',
                }} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Live stage log — every event shown */}
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 16px', background: 'var(--gray-50)',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Agent log
          </p>
          <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>
            {stages.length} event{stages.length !== 1 ? 's' : ''}
          </p>
        </div>

        {stages.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: 13 }}>
            <span style={{ animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }}>Connecting to backend…</span>
          </div>
        ) : (
          stages.map((s, i) => {
            const m = STAGE_META[s.stage] || { icon: '→', color: 'var(--gray-500)', bg: 'var(--gray-50)' }
            const isLatest = i === stages.length - 1
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 16px',
                borderBottom: i < stages.length - 1 ? '1px solid var(--gray-200)' : 'none',
                background: isLatest && !isDone ? m.bg + '60' : '#fff',
                transition: 'background .3s',
              }}>
                {/* Icon */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: m.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 13,
                  border: isLatest && !isDone ? `1.5px solid ${m.color}` : 'none',
                }}>
                  {m.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: m.color }}>
                      {s.stage}
                    </span>
                    {isLatest && !isDone && (
                      <span style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 99,
                        background: m.bg, color: m.color, fontWeight: 600,
                        border: `1px solid ${m.color}40`,
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}>live</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5 }}>
                    {s.message || m.label}
                  </p>
                  {s.data && typeof s.data === 'string' && s.stage === 'research_done' && (
                    <div style={{
                      marginTop: 8, padding: '8px 12px',
                      background: 'var(--gray-50)', borderRadius: 6,
                      borderLeft: '3px solid var(--blue)',
                      fontSize: 12, color: 'var(--gray-500)',
                      fontStyle: 'italic', lineHeight: 1.6,
                    }}>
                      {s.data.slice(0, 300)}{s.data.length > 300 ? '…' : ''}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 14, padding: '10px 16px', background: 'var(--gray-50)',
        border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)',
        fontSize: 12, color: 'var(--gray-500)', textAlign: 'center',
      }}>
        <strong style={{ color: 'var(--navy)' }}>Claude API</strong> · web_search tool use · 
        Instructor + Pydantic · structured JSON output enforced
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  )
}
