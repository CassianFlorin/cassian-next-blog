import React from 'react'

export default function Callout({
  emoji,
  children,
}: {
  emoji?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        borderLeft: '4px solid #fbbf24',
        background: '#fffbe6',
        padding: '12px 16px',
        margin: '16px 0',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {emoji && <span style={{ fontSize: 24, marginRight: 8 }}>{emoji}</span>}
      <div>{children}</div>
    </div>
  )
}
