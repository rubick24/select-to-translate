import { createSignal, onMount } from 'solid-js'
import { render } from 'solid-js/web'

const Popup = () => {
  const [key, setKey] = createSignal('')
  const [language, setLanguage] = createSignal('')

  onMount(async () => {
    const res = await chrome.storage.sync.get(['gemini_key', 'language'])
    setKey(res['gemini_key'])
    setLanguage(res['language'] ?? 'simplified chinese')
  })
  const handleBlur = async () => {
    await chrome.storage.sync.set({ ['gemini_key']: key(), language: language() })
  }

  return (
    <>
      <div>
        <span>Gemini API Key:</span>
        <input value={key()} onChange={v => setKey(v.target.value)} onBlur={handleBlur} />
      </div>
      <div>
        <span>Target Language:</span>
        <input value={language()} onChange={v => setLanguage(v.target.value)} onBlur={handleBlur} />
      </div>
    </>
  )
}

render(() => <Popup />, document.getElementById('root')!)
