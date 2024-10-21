import { batch, createRoot, createSignal, Match, Switch } from 'solid-js'
import { createStore } from 'solid-js/store'
import { render } from 'solid-js/web'
import { computePosition, autoUpdate, shift } from '@floating-ui/dom'

const IconTranslate = () => (
  <svg height="16" width="16" viewBox="0 -960 960 960" fill="currentColor">
    <path d="m476-80 182-480h84L924-80h-84l-43-122H603L560-80h-84ZM160-200l-56-56 202-202q-35-35-63.5-80T190-640h84q20 39 40 68t48 58q33-33 68.5-92.5T484-720H40v-80h280v-80h80v80h280v80H564q-21 72-63 148t-83 116l96 98-30 82-122-125-202 201Zm468-72h144l-72-204-72 204Z" />
  </svg>
)

const IconLoading = () => (
  <svg height="16" width="16" viewBox="0 0 100 100" fill="currentColor">
    <path d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        dur="1s"
        from="0 50 50"
        to="360 50 50"
        repeatCount="indefinite"
      />
    </path>
  </svg>
)

const [store, setStore] = createRoot(() =>
  createStore({
    text: '',
    response: '',
    status: 'ready' as 'ready' | 'loading' | 'done' | 'error'
  })
)

const scopeStyle = `@scope {
  :scope {
    --background-color: #fff;
    --text-color: #5f6368;
    background: var(--background-color);
    color: var(--text-color);

    box-sizing: border-box;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10000;
    margin: 0;
    padding: 2px;
    box-shadow: inset 0 0 0 2px var(--text-color);
    border: none;
    max-width: 480px;
  }
  @media (prefers-color-scheme: dark) {
    :scope {
      --background-color: #202124;
      --text-color: #e8eaed;
    }
  }
}
`
const baseStyle = {
  'box-sizing': 'border-box',
  'display': 'flex'
} as const
const iconStyle = {
  ...baseStyle,
  padding: '4px',
  width: '24px',
  height: '24px'
} as const
const resultStyle = {
  ...baseStyle,
  'white-space': 'pre-wrap',
  'font-size': '14px',
  'padding': '4px'
} as const

const TranslateWidget = () => {
  const handleSend = async () => {
    setStore('status', 'loading')
    const res = await chrome.runtime.sendMessage({ type: 'translate', text: store.text })
    if (res.code === 0) {
      batch(() => {
        setStore('status', 'done')
        setStore('response', res.data)
      })
    } else {
      batch(() => {
        setStore('status', 'error')
        setStore('response', `error ${res.code} ${res.message}`)
      })
    }
  }

  return (
    <>
      <style innerHTML={scopeStyle}></style>
      <Switch fallback={<div style={iconStyle}></div>}>
        <Match when={store.status === 'ready'}>
          <div style={{ ...iconStyle, cursor: 'pointer' }} onMouseDown={e => e.preventDefault()} onClick={handleSend}>
            <IconTranslate />
          </div>
        </Match>
        <Match when={store.status === 'loading'}>
          <div style={iconStyle} onMouseDown={e => e.preventDefault()}>
            <IconLoading />
          </div>
        </Match>
        <Match when={store.status === 'done'}>
          <div style={resultStyle}>{store.response}</div>
        </Match>
        <Match when={store.status === 'error'}>
          <div style={{ ...resultStyle, color: 'red' }}>{store.response}</div>
        </Match>
      </Switch>
    </>
  )
}
const root = document.createElement('div')
root.popover = 'auto'
root.id = '__rubick-translate'
document.body.appendChild(root)
render(() => <TranslateWidget />, root)

let cleanup: (() => void) | undefined = undefined
const hide = () => {
  cleanup?.()
  root.hidePopover()
  batch(() => {
    setStore('status', 'ready')
    setStore('response', '')
  })
}
const show = async ({ x, y }: { x: number; y: number }) => {
  root.showPopover()

  const virtualEl = {
    getBoundingClientRect() {
      return {
        width: 0,
        height: 0,
        x,
        y,
        top: y,
        left: x,
        right: x,
        bottom: y
      }
    },
    contextElement: document.body
  }

  cleanup = autoUpdate(
    virtualEl,
    root,
    () => {
      computePosition(virtualEl, root, {
        strategy: 'fixed',
        middleware: [
          shift({
            mainAxis: true,
            crossAxis: true
          })
        ]
      }).then(({ x, y }) => {
        root.style.transform = `translate(${x}px, ${y}px)`
      })
    },
    {
      ancestorScroll: false,
      layoutShift: false
    }
  )
}

const debounce = <T extends (...args: any) => any>(func: T, timeout = 100) => {
  let timer: number
  return {
    fn: (...args: Parameters<T>) => {
      clearTimeout(timer)

      timer = setTimeout(() => {
        func(...args)
      }, timeout)
    },
    cancel: () => clearTimeout(timer)
  }
}

const getSelectedText = () => {
  const selection = document.getSelection()
  const text = selection?.toString()?.trim()
  if (!selection || selection.type !== 'Range' || !text) {
    debouncedHandler.cancel()
    hide()
    return ''
  }
  return text
}
const debouncedHandler = debounce(async (e: MouseEvent) => {
  const text = getSelectedText()
  if (!text) {
    return
  }
  // only symbols
  if (/^[ _\-=()+*&^%$#@!\[\]{}<>|\\/:;'".,]*$/.test(text)) {
    return
  }
  // target lang
  const res = await chrome.runtime.sendMessage({ type: 'detect', text })
  if (['zh', 'cht'].includes(res)) {
    return
  }

  setStore('text', text)
  show({ x: e.clientX, y: e.clientY })
})

window.addEventListener('mouseup', e => {
  const path = e.composedPath()
  if (path.includes(root) || path.some(el => ['INPUT', 'TEXTAREA'].includes((el as HTMLElement).tagName))) {
    // inside extension or input element
    return
  }
  if (!getSelectedText()) {
    return
  }
  debouncedHandler.fn(e)
})

const set = async (v: boolean) => {
  await chrome.runtime.sendMessage({ type: 'color-schema', color: v ? 'light' : 'dark' })
}
const colorScheme = window.matchMedia('(prefers-color-scheme: light)')
set(colorScheme.matches)
colorScheme.addEventListener('change', e => set(e.matches))
