import React, { useState } from 'react'

const PRIORITY = {
  'must-have':    { label: 'Must-have',    color: 'var(--coral)',  bg: 'var(--coral-light)' },
  'should-have':  { label: 'Should-have',  color: 'var(--amber)',  bg: 'var(--amber-light)' },
  'nice-to-have': { label: 'Nice-to-have', color: 'var(--green)',  bg: 'var(--green-light)' },
}

export default function PRDView({ prd, onRefine, onReset }) {
  const [tab, setTab]               = useState('overview')
  const [refineText, setRefineText] = useState('')
  const [refining, setRefining]     = useState(false)
  const [exporting, setExporting]   = useState(null)   // 'docx' | 'pdf' | 'md' | null

  const [refineNote, setRefineNote]   = useState(null)

  const handleRefine = async () => {
    if (!refineText.trim() || refining) return
    setRefining(true)
    setRefineNote(null)
    const instruction = refineText.trim()
    await onRefine(instruction)
    setRefineText('')
    setRefining(false)
    setRefineNote(`✦ PRD updated based on: "${instruction}" — check all tabs to see changes`)
    setTimeout(() => setRefineNote(null), 8000)
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      if (format === 'md') {
        const res  = await fetch('/api/export/markdown', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prd) })
        const { markdown } = await res.json()
        downloadBlob(new Blob([markdown], { type: 'text/markdown' }), `${slug(prd.title)}.md`)
      } else {
        const res = await fetch(`/api/export/${format}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prd) })
        if (!res.ok) throw new Error(`Export failed: ${res.statusText}`)
        const blob = await res.blob()
        const ext  = format === 'docx' ? 'docx' : 'pdf'
        downloadBlob(blob, `${slug(prd.title)}.${ext}`)
      }
    } catch (e) {
      alert(`Export failed: ${e.message}`)
    }
    setExporting(null)
  }

  const openGoogleDocs = async () => {
    const res = await fetch('/api/export/markdown', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prd) })
    const { markdown } = await res.json()
    await navigator.clipboard.writeText(markdown)
    window.open('https://docs.new', '_blank')
    alert('Markdown copied! In the new Google Doc, paste with Cmd+V — Google Docs will preserve the headings and formatting.')
  }

  const TABS = [
    { id: 'overview',   label: 'Overview' },
    { id: 'stories',    label: `User stories (${prd.user_stories?.length ?? 0})` },
    { id: 'metrics',    label: 'Success metrics' },
    { id: 'risks',      label: 'Risks & edge cases' },
    { id: 'competitive',label: 'Competitive context' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{prd.title}</h2>
          <p style={{ fontSize: 14, color: 'var(--gray-500)', fontStyle: 'italic' }}>{prd.tldr}</p>
        </div>
      {/* Export panel */}
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)', padding: '16px 20px',
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate)', marginRight: 4 }}>Export:</span>

        {[
          { fmt: 'docx', label: '📄 Word (.docx)', color: 'var(--blue)',   bg: 'var(--blue-light)' },
          { fmt: 'pdf',  label: '📕 PDF',          color: 'var(--coral)',  bg: 'var(--coral-light)' },
          { fmt: 'md',   label: '📝 Markdown',     color: 'var(--teal)',   bg: 'var(--teal-light)' },
        ].map(({ fmt, label, color, bg }) => (
          <button key={fmt} onClick={() => handleExport(fmt)} disabled={!!exporting} style={{
            background: exporting === fmt ? bg : 'var(--gray-50)',
            color: exporting === fmt ? color : 'var(--slate)',
            border: `1px solid ${exporting === fmt ? color : 'var(--gray-200)'}`,
            borderRadius: 'var(--radius)', padding: '7px 14px',
            fontSize: 13, fontWeight: 500, transition: 'all .15s',
            cursor: exporting ? 'default' : 'pointer',
          }}>
            {exporting === fmt ? 'Downloading…' : label}
          </button>
        ))}

        <button onClick={openGoogleDocs} disabled={!!exporting} style={{
          background: 'var(--gray-50)', color: 'var(--slate)',
          border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)',
          padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          🟢 Google Docs
        </button>

        <div style={{ marginLeft: 'auto' }}>
          <button onClick={onReset} style={outlineBtn}>← New spec</button>
        </div>
      </div>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'User stories',    value: prd.user_stories?.length ?? 0,    color: 'var(--purple)', bg: 'var(--purple-light)' },
          { label: 'Success metrics', value: prd.success_metrics?.length ?? 0,  color: 'var(--teal)',   bg: 'var(--teal-light)' },
          { label: 'Edge cases',      value: prd.edge_cases?.length ?? 0,       color: 'var(--amber)',  bg: 'var(--amber-light)' },
          { label: 'Open questions',  value: prd.open_questions?.length ?? 0,   color: 'var(--coral)',  bg: 'var(--coral-light)' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: s.color,
            }}>{s.value}</div>
            <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Refining overlay */}
      {refining && (
        <div style={{
          background: 'var(--purple-light)', border: '1px solid var(--purple)',
          borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 14,
          color: 'var(--purple)',
        }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
          Refining your PRD with Claude… this takes ~20 seconds
        </div>
      )}

      {/* Main card */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', marginBottom: 20, overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)', padding: '0 4px', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '12px 16px', border: 'none', background: 'none', fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
              color: tab === t.id ? 'var(--navy)' : 'var(--gray-500)',
              borderBottom: tab === t.id ? '2px solid var(--navy)' : '2px solid transparent',
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {tab === 'overview'    && <OverviewTab prd={prd} />}
          {tab === 'stories'     && <StoriesTab stories={prd.user_stories} />}
          {tab === 'metrics'     && <MetricsTab metrics={prd.success_metrics} />}
          {tab === 'risks'       && <RisksTab prd={prd} />}
          {tab === 'competitive' && <CompetitiveTab items={prd.competitive_context} />}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {refineNote && (
        <div style={{
          background: 'var(--green-light)', border: '1px solid var(--green)',
          borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 12,
          fontSize: 13, color: 'var(--green)', fontWeight: 500,
        }}>{refineNote}</div>
      )}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate)', marginBottom: 12 }}>
          ✦ Refine this spec
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            'Make the user stories more technical',
            'Add a monetization section',
            'Make this more mobile-focused',
            'Add more edge cases for offline usage',
          ].map(suggestion => (
            <button key={suggestion} onClick={() => setRefineText(suggestion)} style={{
              background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
              borderRadius: 99, padding: '4px 12px', fontSize: 12, color: 'var(--slate)',
            }}>{suggestion}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={refineText}
            onChange={e => setRefineText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRefine()}
            placeholder="e.g. Make the acceptance criteria more specific, add a risk about GDPR compliance…"
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 'var(--radius)',
              border: '1px solid var(--gray-200)', fontSize: 14, outline: 'none',
            }}
          />
          <button
            onClick={handleRefine}
            disabled={!refineText.trim() || refining}
            style={{
              background: refineText.trim() ? 'var(--navy)' : 'var(--gray-200)',
              color: refineText.trim() ? '#fff' : 'var(--gray-500)',
              border: 'none', borderRadius: 'var(--radius)',
              padding: '9px 20px', fontSize: 14, fontWeight: 500,
              cursor: refineText.trim() ? 'pointer' : 'default',
            }}
          >
            {refining ? 'Refining…' : 'Refine →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-tabs ──────────────────────────────────────────────────────────────────

function OverviewTab({ prd }) {
  return (
    <div>
      <Section title="Problem statement">{prd.problem_statement}</Section>
      <Section title="Goal">{prd.goal}</Section>
      <Section title="Target users">
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          {prd.target_users?.map((u, i) => <li key={i} style={{ fontSize: 14 }}>{u}</li>)}
        </ul>
      </Section>
      <Section title="Out of scope">
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          {prd.out_of_scope?.map((o, i) => <li key={i} style={{ fontSize: 14, color: 'var(--gray-500)' }}>{o}</li>)}
        </ul>
      </Section>
      {prd.open_questions?.length > 0 && (
        <Section title="Open questions" accent="var(--coral)">
          <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            {prd.open_questions.map((q, i) => (
              <li key={i} style={{ fontSize: 14, color: 'var(--coral)' }}>☐ {q}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function StoriesTab({ stories = [] }) {
  const [open, setOpen] = useState(0)
  return (
    <div>
      {stories.map((story, i) => {
        const p = PRIORITY[story.priority] || PRIORITY['must-have']
        return (
          <div key={i} style={{
            border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)',
            marginBottom: 10, overflow: 'hidden',
          }}>
            <div onClick={() => setOpen(open === i ? -1 : i)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              cursor: 'pointer', background: open === i ? 'var(--gray-50)' : '#fff',
            }}>
              <span style={{
                background: p.bg, color: p.color, fontSize: 11, fontWeight: 600,
                padding: '2px 8px', borderRadius: 99, flexShrink: 0,
              }}>{p.label}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--navy)' }}>
                  As a {story.persona}, I want {story.goal}
                </p>
              </div>
              <span style={{ color: 'var(--gray-500)', transition: 'transform .15s', transform: open === i ? 'rotate(90deg)' : 'none' }}>›</span>
            </div>
            {open === i && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--gray-200)' }}>
                <p style={{ fontSize: 14, color: 'var(--gray-500)', margin: '12px 0 16px', fontStyle: 'italic' }}>
                  So that {story.benefit}
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate)', marginBottom: 8 }}>Acceptance criteria</p>
                {story.criteria?.map((ac, j) => (
                  <div key={j} style={{
                    background: 'var(--gray-50)', borderRadius: 6, padding: '10px 14px',
                    marginBottom: 8, fontSize: 13, lineHeight: 1.6, color: 'var(--gray-700)',
                    borderLeft: '3px solid var(--blue)',
                  }}>
                    <strong>Given</strong> {ac.given} <strong>when</strong> {ac.when} <strong>then</strong> {ac.then}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MetricsTab({ metrics = [] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ background: 'var(--gray-50)' }}>
          {['Metric', 'Baseline', 'Target', 'Timeframe'].map(h => (
            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--slate)', borderBottom: '2px solid var(--gray-200)', fontSize: 13 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {metrics.map((m, i) => (
          <tr key={i} style={{ borderBottom: '1px solid var(--gray-200)' }}>
            <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--navy)' }}>{m.metric}</td>
            <td style={{ padding: '12px 14px', color: 'var(--gray-500)' }}>{m.baseline}</td>
            <td style={{ padding: '12px 14px', color: 'var(--green)', fontWeight: 500 }}>{m.target}</td>
            <td style={{ padding: '12px 14px', color: 'var(--gray-500)' }}>{m.timeframe}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function RisksTab({ prd }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate)', marginBottom: 12 }}>⚠ Risks</p>
        {prd.risks?.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
            <span style={{ color: 'var(--coral)', fontSize: 12, marginTop: 2 }}>•</span>
            <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.5 }}>{r}</p>
          </div>
        ))}
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate)', marginBottom: 12 }}>🔧 Edge cases</p>
        {prd.edge_cases?.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
            <span style={{ color: 'var(--amber)', fontSize: 12, marginTop: 2 }}>•</span>
            <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.5 }}>{e}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompetitiveTab({ items = [] }) {
  if (!items?.length) return (
    <p style={{ fontSize: 14, color: 'var(--gray-500)', fontStyle: 'italic' }}>
      No competitive research available — enable web search and regenerate.
    </p>
  )
  return (
    <div>
      {items.map((c, i) => (
        <div key={i} style={{
          border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)',
          padding: '16px', marginBottom: 12,
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>{c.competitor}</p>
          <p style={{ fontSize: 13, color: 'var(--gray-700)', marginBottom: 6 }}>
            <strong>How they solve it:</strong> {c.how_they_solve_it}
          </p>
          <p style={{ fontSize: 13, color: 'var(--teal)' }}>
            <strong>Gap / opportunity:</strong> {c.gap_or_opportunity}
          </p>
        </div>
      ))}
    </div>
  )
}

function Section({ title, children, accent = 'var(--navy)' }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate)', marginBottom: 8, borderBottom: '1px solid var(--gray-200)', paddingBottom: 6 }}>
        {title}
      </p>
      {typeof children === 'string'
        ? <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.7 }}>{children}</p>
        : children}
    </div>
  )
}

const outlineBtn = {
  background: 'none', border: '1px solid var(--gray-200)', color: 'var(--slate)',
  borderRadius: 'var(--radius)', padding: '7px 14px', fontSize: 13, fontWeight: 500,
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function slug(title = '') {
  return title.slice(0, 50).replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}
