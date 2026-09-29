import React, { useReducer, useEffect, useState, useRef } from 'react'
import {
  isSupabaseConfigured,
  fetchHistoryFromSupabase,
  saveCalculationToSupabase,
  clearHistoryInSupabase
} from './supabaseClient'
import './Calculator.css'

const initialState = {
  currentInput: '0',
  previousInput: null,
  operation: null,
  overwrite: false,
  lastExpression: '',
  history: []
}

function calculate(a, b, op) {
  const numA = parseFloat(a)
  const numB = parseFloat(b)
  if (isNaN(numA) || isNaN(numB)) return '0'

  let res = 0
  switch (op) {
    case '+':
      res = numA + numB
      break
    case '-':
      res = numA - numB
      break
    case '×':
    case '*':
      res = numA * numB
      break
    case '÷':
    case '/':
      if (numB === 0) return 'Error'
      res = numA / numB
      break
    default:
      return numB.toString()
  }

  // Format to avoid floating point issues (e.g. 0.1 + 0.2 = 0.3)
  const formatted = parseFloat(res.toPrecision(12))
  return formatted.toString()
}

function calculatorReducer(state, action) {
  switch (action.type) {
    case 'NUMBER': {
      const digit = action.payload

      if (state.currentInput === 'Error' || state.overwrite) {
        return {
          ...state,
          currentInput: digit,
          overwrite: false
        }
      }

      if (state.currentInput === '0') {
        return {
          ...state,
          currentInput: digit
        }
      }

      // Limit to max 14 characters to avoid visual overflow
      if (state.currentInput.replace('-', '').length >= 14) {
        return state
      }

      return {
        ...state,
        currentInput: state.currentInput + digit
      }
    }

    case 'DECIMAL': {
      if (state.currentInput === 'Error' || state.overwrite) {
        return {
          ...state,
          currentInput: '0.',
          overwrite: false
        }
      }

      if (state.currentInput.includes('.')) {
        return state
      }

      return {
        ...state,
        currentInput: state.currentInput + '.'
      }
    }

    case 'OPERATOR': {
      const op = action.payload
      if (state.currentInput === 'Error') return state

      if (state.previousInput === null) {
        return {
          ...state,
          previousInput: state.currentInput,
          operation: op,
          lastExpression: `${state.currentInput} ${op}`,
          overwrite: true
        }
      }

      if (state.overwrite) {
        // Change operator if user clicks another operator
        return {
          ...state,
          operation: op,
          lastExpression: `${state.previousInput} ${op}`
        }
      }

      if (state.operation) {
        const result = calculate(state.previousInput, state.currentInput, state.operation)
        if (result === 'Error') {
          return {
            ...state,
            currentInput: 'Error',
            previousInput: null,
            operation: null,
            lastExpression: '',
            overwrite: true
          }
        }

        return {
          ...state,
          previousInput: result,
          currentInput: result,
          operation: op,
          lastExpression: `${result} ${op}`,
          overwrite: true
        }
      }

      return state
    }

    case 'EQUALS': {
      if (state.operation === null || state.previousInput === null || state.currentInput === 'Error') {
        return state
      }

      const expression = `${state.previousInput} ${state.operation} ${state.currentInput}`
      const result = calculate(state.previousInput, state.currentInput, state.operation)

      const updatedHistory =
        result === 'Error'
          ? state.history
          : [
              {
                id: Date.now(),
                expression: `${expression} =`,
                result
              },
              ...state.history.slice(0, 19)
            ]

      return {
        ...state,
        currentInput: result,
        previousInput: null,
        operation: null,
        lastExpression: `${expression} =`,
        overwrite: true,
        history: updatedHistory
      }
    }

    case 'CLEAR': {
      return {
        ...state,
        currentInput: '0',
        previousInput: null,
        operation: null,
        lastExpression: '',
        overwrite: false
      }
    }

    case 'BACKSPACE': {
      if (state.currentInput === 'Error' || state.overwrite) {
        return {
          ...state,
          currentInput: '0',
          overwrite: false
        }
      }

      if (
        state.currentInput.length === 1 ||
        (state.currentInput.length === 2 && state.currentInput.startsWith('-'))
      ) {
        return {
          ...state,
          currentInput: '0'
        }
      }

      return {
        ...state,
        currentInput: state.currentInput.slice(0, -1)
      }
    }

    case 'TOGGLE_SIGN': {
      if (state.currentInput === '0' || state.currentInput === 'Error') {
        return state
      }

      const nextVal = state.currentInput.startsWith('-')
        ? state.currentInput.slice(1)
        : '-' + state.currentInput

      return {
        ...state,
        currentInput: nextVal
      }
    }

    case 'PERCENT': {
      if (state.currentInput === 'Error') return state
      const num = parseFloat(state.currentInput)
      if (isNaN(num)) return state

      const res = parseFloat((num / 100).toPrecision(12)).toString()
      return {
        ...state,
        currentInput: res,
        overwrite: true
      }
    }

    case 'SQRT': {
      if (state.currentInput === 'Error') return state
      const num = parseFloat(state.currentInput)
      if (isNaN(num) || num < 0) {
        return {
          ...state,
          currentInput: 'Error',
          lastExpression: `√(${state.currentInput})`,
          overwrite: true
        }
      }

      const res = parseFloat(Math.sqrt(num).toPrecision(12)).toString()
      const expr = `√(${state.currentInput})`
      return {
        ...state,
        currentInput: res,
        lastExpression: `${expr} =`,
        overwrite: true,
        history: [
          { id: Date.now(), expression: `${expr} =`, result: res },
          ...state.history.slice(0, 19)
        ]
      }
    }

    case 'LOG10': {
      if (state.currentInput === 'Error') return state
      const num = parseFloat(state.currentInput)
      if (isNaN(num) || num <= 0) {
        return {
          ...state,
          currentInput: 'Error',
          lastExpression: `log(${state.currentInput})`,
          overwrite: true
        }
      }

      const res = parseFloat(Math.log10(num).toPrecision(12)).toString()
      const expr = `log(${state.currentInput})`
      return {
        ...state,
        currentInput: res,
        lastExpression: `${expr} =`,
        overwrite: true,
        history: [
          { id: Date.now(), expression: `${expr} =`, result: res },
          ...state.history.slice(0, 19)
        ]
      }
    }

    case 'LN': {
      if (state.currentInput === 'Error') return state
      const num = parseFloat(state.currentInput)
      if (isNaN(num) || num <= 0) {
        return {
          ...state,
          currentInput: 'Error',
          lastExpression: `ln(${state.currentInput})`,
          overwrite: true
        }
      }

      const res = parseFloat(Math.log(num).toPrecision(12)).toString()
      const expr = `ln(${state.currentInput})`
      return {
        ...state,
        currentInput: res,
        lastExpression: `${expr} =`,
        overwrite: true,
        history: [
          { id: Date.now(), expression: `${expr} =`, result: res },
          ...state.history.slice(0, 19)
        ]
      }
    }

    case 'SQUARE': {
      if (state.currentInput === 'Error') return state
      const num = parseFloat(state.currentInput)
      if (isNaN(num)) return state

      const res = parseFloat((num * num).toPrecision(12)).toString()
      const expr = `sqr(${state.currentInput})`
      return {
        ...state,
        currentInput: res,
        lastExpression: `${expr} =`,
        overwrite: true,
        history: [
          { id: Date.now(), expression: `${expr} =`, result: res },
          ...state.history.slice(0, 19)
        ]
      }
    }

    case 'USE_HISTORY_ITEM': {
      return {
        ...state,
        currentInput: action.payload,
        overwrite: true
      }
    }

    case 'SET_HISTORY': {
      return {
        ...state,
        history: action.payload
      }
    }

    case 'CLEAR_HISTORY': {
      return {
        ...state,
        history: []
      }
    }

    default:
      return state
  }
}

// Optional synthetic click sound with Web Audio API
function playClickSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.04)

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(audioCtx.destination)

    osc.start()
    osc.stop(audioCtx.currentTime + 0.04)
  } catch {
    // AudioContext might be blocked before user gesture
  }
}

export default function Calculator() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState)
  const [showHistory, setShowHistory] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeKey, setActiveKey] = useState(null)
  const displayRef = useRef(null)

  const triggerAction = React.useCallback(
    (action, keyIdentifier) => {
      if (soundEnabled) {
        playClickSound()
      }
      if (keyIdentifier) {
        setActiveKey(keyIdentifier)
        setTimeout(() => setActiveKey(null), 150)
      }
      dispatch(action)
    },
    [soundEnabled]
  )

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if modifier keys like Ctrl or Meta are held (e.g. Ctrl+R, Ctrl+C)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        // Allow copy with ctrl+c handled natively
        return
      }

      if (e.key >= '0' && e.key <= '9') {
        triggerAction({ type: 'NUMBER', payload: e.key }, e.key)
      } else if (e.key === '.' || e.key === ',') {
        triggerAction({ type: 'DECIMAL' }, '.')
      } else if (e.key === '+') {
        triggerAction({ type: 'OPERATOR', payload: '+' }, '+')
      } else if (e.key === '-') {
        triggerAction({ type: 'OPERATOR', payload: '-' }, '-')
      } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        triggerAction({ type: 'OPERATOR', payload: '×' }, '×')
      } else if (e.key === '/') {
        e.preventDefault()
        triggerAction({ type: 'OPERATOR', payload: '÷' }, '÷')
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault()
        triggerAction({ type: 'EQUALS' }, '=')
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        triggerAction({ type: 'BACKSPACE' }, 'backspace')
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        triggerAction({ type: 'CLEAR' }, 'clear')
      } else if (e.key === '%') {
        triggerAction({ type: 'PERCENT' }, '%')
      } else if (e.key.toLowerCase() === 'r') {
        triggerAction({ type: 'SQRT' }, 'sqrt')
      } else if (e.key.toLowerCase() === 'l') {
        triggerAction({ type: 'LOG10' }, 'log')
      } else if (e.key.toLowerCase() === 'n') {
        triggerAction({ type: 'LN' }, 'ln')
      } else if (e.key.toLowerCase() === 's') {
        triggerAction({ type: 'SQUARE' }, 'sqr')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerAction])

  // Copy result to clipboard
  const handleCopy = () => {
    if (state.currentInput && state.currentInput !== 'Error') {
      navigator.clipboard.writeText(state.currentInput)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  // Adjust display font size according to string length
  const getDisplayClass = () => {
    const len = state.currentInput.length
    if (len > 12) return 'calc-display-digits text-sm'
    if (len > 8) return 'calc-display-digits text-md'
    return 'calc-display-digits text-lg'
  }

  // Load initial history from Supabase if configured
  useEffect(() => {
    let isMounted = true
    async function loadRemoteHistory() {
      if (isSupabaseConfigured) {
        const remoteData = await fetchHistoryFromSupabase()
        if (isMounted && remoteData && remoteData.length > 0) {
          dispatch({ type: 'SET_HISTORY', payload: remoteData })
        }
      }
    }
    loadRemoteHistory()
    return () => {
      isMounted = false
    }
  }, [])

  // Sync new calculations to Supabase in the background
  const lastSavedItemRef = useRef(null)
  useEffect(() => {
    if (isSupabaseConfigured && state.history.length > 0) {
      const latest = state.history[0]
      if (latest && latest !== lastSavedItemRef.current) {
        lastSavedItemRef.current = latest
        saveCalculationToSupabase(latest.expression, latest.result)
      }
    }
  }, [state.history])

  // Clear history both locally and in Supabase
  const handleClearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' })
    if (isSupabaseConfigured) {
      clearHistoryInSupabase()
    }
  }

  return (
    <div className="calculator-container">
      <div className="calculator-card">
        {/* Header toolbar */}
        <div className="calculator-header">
          <div className="calc-title">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
            <span className="calc-name">Calculadora</span>
            <span
              className={`supabase-badge ${isSupabaseConfigured ? 'connected' : 'offline'}`}
              title={
                isSupabaseConfigured
                  ? 'Supabase conectado: el historial se sincroniza en la nube'
                  : 'Supabase en modo local (configura VITE_SUPABASE_ANON_KEY en .env)'
              }
            >
              <span className="supabase-dot"></span>
              {isSupabaseConfigured ? 'Supabase' : 'Local'}
            </span>
          </div>

          <div className="header-actions">
            <button
              className={`icon-btn ${soundEnabled ? 'active' : ''}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido de clic'}
              aria-label="Alternar sonido"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button
              className={`icon-btn ${showHistory ? 'active' : ''}`}
              onClick={() => setShowHistory(!showHistory)}
              title="Historial de cálculos"
              aria-label="Ver historial"
            >
              🕒
            </button>
          </div>
        </div>

        {/* Display Screen */}
        <div className="calc-screen" onClick={handleCopy} title="Clic para copiar">
          <div className="calc-expression">
            {state.lastExpression || (state.operation ? `${state.previousInput} ${state.operation}` : '')}
          </div>
          <div className="calc-main-row">
            <div ref={displayRef} className={getDisplayClass()}>
              {state.currentInput}
            </div>
            {copied && <span className="copied-tooltip">¡Copiado!</span>}
          </div>
        </div>

        {/* History drawer overlay */}
        {showHistory && (
          <div className="history-drawer">
            <div className="history-header">
              <span>Historial reciente</span>
              {state.history.length > 0 && (
                <button
                  className="clear-history-btn"
                  onClick={handleClearHistory}
                >
                  Borrar
                </button>
              )}
            </div>
            <div className="history-list">
              {state.history.length === 0 ? (
                <div className="history-empty">No hay operaciones recientes</div>
              ) : (
                state.history.map((item) => (
                  <div
                    key={item.id}
                    className="history-item"
                    onClick={() => {
                      dispatch({ type: 'USE_HISTORY_ITEM', payload: item.result })
                      setShowHistory(false)
                    }}
                    title="Clic para cargar este resultado"
                  >
                    <span className="history-expr">{item.expression}</span>
                    <span className="history-res">{item.result}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Keypad */}
        <div className="calculator-keypad">
          {/* Row 0 - Funciones Científicas */}
          <button
            className={`btn btn-sci ${activeKey === 'sqrt' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'SQRT' }, 'sqrt')}
            title="Raíz cuadrada (Tecla R)"
            aria-label="Raíz cuadrada"
          >
            √x
          </button>
          <button
            className={`btn btn-sci ${activeKey === 'sqr' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'SQUARE' }, 'sqr')}
            title="Elevar al cuadrado (Tecla S)"
            aria-label="Elevar al cuadrado"
          >
            x²
          </button>
          <button
            className={`btn btn-sci ${activeKey === 'log' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'LOG10' }, 'log')}
            title="Logaritmo decimal (Tecla L)"
            aria-label="Logaritmo decimal"
          >
            log
          </button>
          <button
            className={`btn btn-sci ${activeKey === 'ln' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'LN' }, 'ln')}
            title="Logaritmo natural (Tecla N)"
            aria-label="Logaritmo natural"
          >
            ln
          </button>
          {/* Row 1 */}
          <button
            className={`btn btn-fn ${activeKey === 'clear' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'CLEAR' })}
            aria-label="Limpiar todo"
          >
            {state.currentInput !== '0' || state.previousInput !== null ? 'C' : 'AC'}
          </button>
          <button
            className={`btn btn-fn ${activeKey === 'backspace' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'BACKSPACE' })}
            aria-label="Borrar último dígito"
          >
            ⌫
          </button>
          <button
            className={`btn btn-fn ${activeKey === '%' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'PERCENT' })}
            aria-label="Porcentaje"
          >
            %
          </button>
          <button
            className={`btn btn-op ${state.operation === '÷' ? 'op-selected' : ''} ${
              activeKey === '÷' ? 'active-key' : ''
            }`}
            onClick={() => triggerAction({ type: 'OPERATOR', payload: '÷' }, '÷')}
            aria-label="Dividir"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            className={`btn btn-num ${activeKey === '7' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'NUMBER', payload: '7' }, '7')}
          >
            7
          </button>
          <button
            className={`btn btn-num ${activeKey === '8' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'NUMBER', payload: '8' }, '8')}
          >
            8
          </button>
          <button
            className={`btn btn-num ${activeKey === '9' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'NUMBER', payload: '9' }, '9')}
          >
            9
          </button>
          <button
            className={`btn btn-op ${state.operation === '×' ? 'op-selected' : ''} ${
              activeKey === '×' ? 'active-key' : ''
            }`}
            onClick={() => triggerAction({ type: 'OPERATOR', payload: '×' }, '×')}
            aria-label="Multiplicar"
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            className={`btn btn-num ${activeKey === '4' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'NUMBER', payload: '4' }, '4')}
          >
            4
          </button>
          <button
            className={`btn btn-num ${activeKey === '5' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'NUMBER', payload: '5' }, '5')}
          >
            5
          </button>
          <button
            className={`btn btn-num ${activeKey === '6' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'NUMBER', payload: '6' }, '6')}
          >
            6
          </button>
          <button
            className={`btn btn-op ${state.operation === '-' ? 'op-selected' : ''} ${
              activeKey === '-' ? 'active-key' : ''
            }`}
            onClick={() => triggerAction({ type: 'OPERATOR', payload: '-' }, '-')}
            aria-label="Restar"
          >
            −
          </button>

          {/* Row 4 */}
          <button
            className={`btn btn-num ${activeKey === '1' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'NUMBER', payload: '1' }, '1')}
          >
            1
          </button>
          <button
            className={`btn btn-num ${activeKey === '2' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'NUMBER', payload: '2' }, '2')}
          >
            2
          </button>
          <button
            className={`btn btn-num ${activeKey === '3' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'NUMBER', payload: '3' }, '3')}
          >
            3
          </button>
          <button
            className={`btn btn-op ${state.operation === '+' ? 'op-selected' : ''} ${
              activeKey === '+' ? 'active-key' : ''
            }`}
            onClick={() => triggerAction({ type: 'OPERATOR', payload: '+' }, '+')}
            aria-label="Sumar"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            className="btn btn-fn"
            onClick={() => triggerAction({ type: 'TOGGLE_SIGN' })}
            aria-label="Cambiar signo"
          >
            ±
          </button>
          <button
            className={`btn btn-num ${activeKey === '0' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'NUMBER', payload: '0' }, '0')}
          >
            0
          </button>
          <button
            className={`btn btn-num ${activeKey === '.' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'DECIMAL' }, '.')}
            aria-label="Punto decimal"
          >
            .
          </button>
          <button
            className={`btn btn-equals ${activeKey === '=' ? 'active-key' : ''}`}
            onClick={() => triggerAction({ type: 'EQUALS' }, '=')}
            aria-label="Calcular resultado"
          >
            =
          </button>
        </div>

        {/* Keyboard hints footer */}
        <div className="keyboard-hints">
          <span>Teclado: 0-9, +, -, *, /, =, Esc, R (√), L (log), N (ln), S (x²)</span>
        </div>
      </div>
    </div>
  )
}
