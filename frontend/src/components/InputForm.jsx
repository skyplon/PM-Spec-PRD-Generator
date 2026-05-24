import React, { useState } from 'react'

const EXAMPLES = [
  {
    label: 'AI writing assistant',
    idea: 'Add an AI writing assistant to our email composer that suggests subject lines, rewrites paragraphs for tone, and flags emails that sound too aggressive before sending.',
    product_name: 'InboxPro',
    domain: 'Email SaaS',
    user_type: 'business professionals',
  },
  {
    label: 'Smart expense approvals',
    idea: 'Build an automated expense approval workflow that uses AI to flag unusual spending, route approvals to the right manager based on amount and category, and auto-approve recurring expenses under a set threshold.',
    product_name: 'FinanceFlow',
    domain: 'Finance SaaS',
    user_type: 'employees and finance managers',
  },
  {
    label: 'In-app onboarding checklist',
    idea: 'Create a personalized onboarding checklist that adapts based on the user\'s role and use case, shows completion progress, and triggers contextual tooltips when users first encounter each feature.',
    product_name: 'WorkOS',
    domain: 'B2B SaaS',
    user_type: 'new users and admins',
  },
]

export default function InputForm({ onSubmit }) {
  const [idea, setIdea]               = useState('')
  const [productName, setProductName] = useState('')
  const [domain, setDomain]           = useState('')
  const [userType, setUserType]       = useState('')
  const [searchWeb, setSearchWeb]     = useState(true)
  const [loading, setLoading]         = useState(false)

  const loadExample = (ex) => {
    setIdea(ex.idea)
    setProductName(ex.product_name)
    setDomain(ex.domain)
    setUserType(ex.user_type)
  }

  const handleSubmit = async () => {
    if (!idea.trim() || loading) return
    setLoading(true)
    await onSubmit({
      idea: idea.trim(),
      product_name: productName || 'Our Product',
      domain: domain || 'SaaS',
      user_type: userType || 'end users',
      search_web: searchWeb,
    })
    setLoading(false)
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: 14, background: 'var(--navy)',
          fontSize: 24, marginBottom: 16,
        }}>✦</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
          PM Spec Generator
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
          Describe a feature idea in plain English — get a full developer-ready PRD
          with user stories, acceptance criteria, and competitive context in 30 seconds.
        </p>
      </div>

      {/* Pipeline badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 32, flexWrap: 'wrap' }}>
        {[
          { label: 'Web research',      color: 'var(--blue)',   bg: 'var(--blue-light)' },
          { label: 'Spec writing',      color: 'var(--purple)', bg: 'var(--purple-light)' },
          { label: 'User stories',      color: 'var(--teal)',   bg: 'var(--teal-light)' },
          { label: 'Acceptance criteria', color: 'var(--amber)', bg: 'var(--amber-light)' },
          { label: 'Risk analysis',     color: 'var(--coral)',  bg: 'var(--coral-light)' },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <span style={{ color: 'var(--gray-500)', fontSize: 12, alignSelf: 'center' }}>→</span>}
            <span style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 99 }}>
              {s.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)', padding: 28,
      }}>
        {/* Example loader */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate)', marginBottom: 8 }}>
            Load an example:
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EXAMPLES.map(ex => (
              <button key={ex.label} onClick={() => loadExample(ex)} style={{
                background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                borderRadius: 6, padding: '6px 12px', fontSize: 13, color: 'var(--slate)',
              }}>
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Idea textarea */}
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Feature idea <span style={{ color: 'var(--coral)' }}>*</span></label>
          <textarea
            value={idea}
            onChange={e => setIdea(e.target.value)}
            placeholder="Describe the feature you want to build. Be specific about what problem it solves and who it's for. 2-4 sentences is ideal."
            style={{
              ...input, minHeight: 120, resize: 'vertical',
              fontFamily: 'inherit', lineHeight: 1.6,
            }}
          />
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
            {idea.length} chars · aim for 100-300 for best results
          </p>
        </div>

        {/* Context row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={label}>Product name</label>
            <input value={productName} onChange={e => setProductName(e.target.value)}
              placeholder="e.g. InboxPro" style={input} />
          </div>
          <div>
            <label style={label}>Domain / industry</label>
            <input value={domain} onChange={e => setDomain(e.target.value)}
              placeholder="e.g. Email SaaS" style={input} />
          </div>
          <div>
            <label style={label}>Primary user type</label>
            <input value={userType} onChange={e => setUserType(e.target.value)}
              placeholder="e.g. sales reps" style={input} />
          </div>
        </div>

        {/* Web search toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          background: searchWeb ? 'var(--blue-light)' : 'var(--gray-50)',
          borderRadius: 'var(--radius)', marginBottom: 20, cursor: 'pointer',
          border: `1px solid ${searchWeb ? '#93C5FD' : 'var(--gray-200)'}`,
          transition: 'all .15s',
        }} onClick={() => setSearchWeb(!searchWeb)}>
          <div style={{
            width: 18, height: 18, borderRadius: 4,
            background: searchWeb ? 'var(--blue)' : 'var(--gray-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: '#fff', flexShrink: 0,
          }}>
            {searchWeb ? '✓' : ''}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)' }}>
              🔍 Run web research first
            </p>
            <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              Claude will search for competitor implementations before writing the spec
            </p>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleSubmit}
            disabled={!idea.trim() || loading}
            style={{
              background: idea.trim() ? 'var(--navy)' : 'var(--gray-200)',
              color: idea.trim() ? '#fff' : 'var(--gray-500)',
              border: 'none', borderRadius: 'var(--radius)', padding: '11px 28px',
              fontSize: 15, fontWeight: 600, transition: 'all .15s',
              cursor: idea.trim() ? 'pointer' : 'default',
            }}
          >
            {loading ? 'Generating…' : '✦  Generate PRD'}
          </button>
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            Takes ~30 seconds with web research, ~15 without
          </span>
        </div>
      </div>
    </div>
  )
}

const label = {
  display: 'block', fontSize: 13, fontWeight: 500,
  color: 'var(--slate)', marginBottom: 6,
}
const input = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)',
  border: '1px solid var(--gray-200)', fontSize: 14,
  color: 'var(--gray-700)', outline: 'none', background: '#fff',
}
