type LogType = 'info' | 'warn' | 'error'

export type DebugLog = {
  id: number
  time: string
  type: LogType
  message: string
  data?: any
}

let listeners: ((logs: DebugLog[]) => void)[] = []
let logs: DebugLog[] = []
let logId = 0

const MAX_LOGS = 50

function notify() {
  listeners.forEach(l => l([...logs]))
}

export const debugLogger = {
  subscribe(listener: (logs: DebugLog[]) => void) {
    listeners.push(listener)
    listener(logs)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  },

  log(message: string, data?: any) {
    addLog('info', message, data)
  },

  warn(message: string, data?: any) {
    addLog('warn', message, data)
  },

  error(message: string, data?: any) {
    addLog('error', message, data)
  },

  clear() {
    logs = []
    notify()
  }
}

function addLog(type: LogType, message: string, data?: any) {
  logs.push({
    id: ++logId,
    time: new Date().toLocaleTimeString(),
    type,
    message,
    data
  })

  if (logs.length > MAX_LOGS) {
    logs.shift()
  }

  notify()
}
