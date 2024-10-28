const SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_NONE'
  }
]

const paragraphInstruction = (v: string) => `1. Translate all inputs into ${v}.
2. Return plain text without other syntax in markdown.`
const wordInstruction = (v: string) => `1. Output english phonetic symbols of the input word.
2. List each word class of the input word like n. v. adj. adv., then with corresponding meaning of the word translated in ${v}, each word class a row.
3. Return plain text without other syntax in markdown.`

let currentColor = 'dark'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'translate') {
    const text = message.text

    const instruction = text.split(/[ \n\t,.]/).length > 1 ? paragraphInstruction : wordInstruction

    const fn = async () => {
      const st = await chrome.storage.sync.get(['gemini_key', 'language'])
      const key = st?.['gemini_key'] ?? ''
      const targetLang = st?.['language'] ?? 'simplified chinese'

      try {
        const res = (await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
          {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: {
                parts: {
                  text: instruction(targetLang)
                }
              },
              contents: {
                parts: { text }
              },
              safetySettings: SAFETY_SETTINGS
            })
          }
        ).then(v => v.json())) as
          | {
              candidates: {
                content: {
                  parts: {
                    text: string
                  }[]
                  role: string
                }
                finishReason: string
                index: number
              }[]
              usageMetadata: {
                promptTokenCount: number
                candidatesTokenCount: number
                totalTokenCount: number
              }
            }
          | {
              error: {
                code: string
                message: string
                status: string
                // details:
              }
            }
        if ('error' in res) {
          throw new Error(`${res.error.code} ${res.error.status} ${res.error.message}`)
        }
        return { code: 0, data: res.candidates[0]?.content?.parts?.map(v => v.text).join('') }
      } catch (e: any) {
        return { code: -2, message: e?.message || e?.toString?.() }
      }
    }

    fn().then(sendResponse)
    return true
  } else if (message.type === 'detect') {
    baiduDetectLang(message.text).then(sendResponse)
    return true
  }
})

const baiduDetectLang = async (text: string) => {
  const url = `https://fanyi.baidu.com/langdetect?${new URLSearchParams({ query: text }).toString()}`
  try {
    const res = await (await fetch(url, { method: 'post', signal: AbortSignal.timeout(1000) })).json()
    return res.lan ?? 'en'
  } catch (e) {
    return 'en'
  }
}
