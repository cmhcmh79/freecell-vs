'use client'

import { useEffect, useState } from 'react'
import { debugLogger, DebugLog } from '@/utils/debugLogger'

export default function DebugLogPanel() {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [open, setOpen] = useState(true)

  useEffect(() => {
    return debugLogger.subscribe(setLogs)
  }, [])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          zIndex: 9999
        }}
      >
        🐞
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        width: 360,
        maxHeight: 300,
        overflowY: 'auto',
        background: '#111',
        color: '#fff',
        fontSize: 12,
        padding: 8,
        borderRadius: 8,
        zIndex: 9999
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>Debug Log</strong>
        <div>
          <button onClick={() => debugLogger.clear()}>🗑</button>
          <button onClick={() => setOpen(false)}>✕</button>
        </div>
      </div>

      {[...logs].reverse().map(log => (
        <div
          key={log.id}
          style={{
            marginTop: 6,
            padding: 6,
            background:
              log.type === 'error'
                ? '#402'
                : log.type === 'warn'
                ? '#332'
                : '#222'
          }}
        >
          <div>
            [{log.time}] <b>{log.type.toUpperCase()}</b>
          </div>
          <div>{log.message}</div>
          {log.data && (
            <pre style={{ whiteSpace: 'pre-wrap', color: '#aaa' }}>
              {JSON.stringify(log.data, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  )
}
