import { createSignal, For, onMount } from 'solid-js'
import { render } from 'solid-js/web'
import { langs } from './constants'

const styles = `
@scope {
  :scope {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 320px;
  }
  .form_item {
    display: flex;
    gap: 4px;
    align-items: center;
    & > label {
      width: 100px;
    }
    & > input, select {
      flex: 1;
    }
  }
}
`

const Popup = () => {
  const [key, setKey] = createSignal('')
  const [language, setLanguage] = createSignal('')

  onMount(async () => {
    const res = await chrome.storage.sync.get(['gemini_key', 'language'])
    setKey(res['gemini_key'])
    setLanguage(res['language'] ?? 'chinese')
  })

  return (
    <>
      <style innerHTML={styles}></style>
      <div class="form_item">
        <label for="gemini_key">Gemini API Key:</label>
        <input
          name="gemini_key"
          value={key()}
          onChange={v => setKey(v.target.value)}
          onBlur={async () => {
            await chrome.storage.sync.set({ ['gemini_key']: key() })
          }}
        />
      </div>
      <div class="form_item">
        <label for="language">Target Language:</label>
        <select
          name="language"
          value={language()}
          onChange={async v => {
            setLanguage(v.target.value)
            await chrome.storage.sync.set({ language: language() })
          }}
        >
          <For each={langs}>{v => <option value={v}>{v}</option>}</For>
        </select>
      </div>
    </>
  )
}

render(() => <Popup />, document.getElementById('root')!)
