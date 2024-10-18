import { batch, createRoot, createSignal, Match, Switch } from 'solid-js'
import { createStore } from 'solid-js/store'

import { render } from 'solid-js/web'

const IconTranslate = () => (
  <svg height="16" width="16" viewBox="0 -960 960 960" fill="#222222">
    <path d="m476-80 182-480h84L924-80h-84l-43-122H603L560-80h-84ZM160-200l-56-56 202-202q-35-35-63.5-80T190-640h84q20 39 40 68t48 58q33-33 68.5-92.5T484-720H40v-80h280v-80h80v80h280v80H564q-21 72-63 148t-83 116l96 98-30 82-122-125-202 201Zm468-72h144l-72-204-72 204Z" />
  </svg>
)

const IconLoading = () => (
  <svg height="16" width="16" viewBox="0 0 100 100" fill="#222222">
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
    status: 'ready'
  })
)

const TranslateWidget = () => {
  const handleSend = async () => {
    setStore('status', 'loading')
    const res = await chrome.runtime.sendMessage({ text: store.text })
    console.log(res)
    batch(() => {
      setStore('status', 'done')
      setStore('response', res)
    })
  }
  return (
    <div
      style={{
        'box-sizing': 'border-box',
        'display': 'flex',
        'background': '#fff',
        'padding': '3px',
        'border': '1px solid #ddd',
        'min-width': '24px',
        'min-height': '24px',
        'border-radius': '4px'
      }}
      onMouseDown={e => e.preventDefault()}
      onClick={handleSend}
    >
      <Switch fallback={<IconTranslate />}>
        <Match when={store.status === 'loading'}>
          <IconLoading />
        </Match>
        <Match when={store.status === 'done'}>{store.response}</Match>
      </Switch>
    </div>
  )
}
const root = document.createElement('div')
root.className = '__rubick-translate'
Object.assign(root.style, {
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 10000,
  display: 'none'
})
document.body.appendChild(root)
render(() => <TranslateWidget />, root)

const hide = () => (root.style.display = 'none')
const show = ({ x, y }: { x: number; y: number }) => {
  root.style.display = 'flex'
  root.style.transform = `translate(${x}px, ${y}px)`
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
  const text = selection?.toString()
  if (!selection || selection.type !== 'Range' || !text) {
    debouncedHandler.cancel()
    hide()
    return ''
  }
  return text
}
const debouncedHandler = debounce((e: MouseEvent) => {
  const text = getSelectedText()
  if (!text) {
    return
  }
  setStore('text', text)
  show({ x: e.clientX, y: e.clientY })
})

window.addEventListener('mouseup', e => {
  if (e.composedPath().includes(root)) {
    // 插件内部
    return
  }
  if (!getSelectedText()) {
    return
  }
  debouncedHandler.fn(e)
})
