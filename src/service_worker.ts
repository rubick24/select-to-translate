import { langsMap } from './constants'

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

const instruction = `
You are performing as a professional translator, the translate task input will be following structure of JSON:
\`\`\`json
{ "targetLanguage": "...", "inputText": "..." }
\`\`\`
you need to translate content of "inputText" attribute to the language specified by "targetLanguage" attribute.
If the inputText contains more then a word, return translated text directly as plain text without other syntax like markdown.
If the inputText is a single word, return it's pronunciation symbols in first line, then for each word class of the input word, return a line with this word class and it's meaning in targetLanguage.

Example 1:
Input:
{ "targetLanguage": "chinese", "inputText": "The quick brown fox jumps over the lazy dog" }
Output:
快速的棕色狐狸跳过懒惰的狗

Example 2:
Input:
{ "targetLanguage": "chinese", "inputText": "handle" }
Output:
/ˈhæn.dəl/
noun 用于方便握持、移动或搬运物体的物件的一部分
verb 处理，负责，或掌管
`
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'translate') {
    const fn = async () => {
      const st = await chrome.storage.sync.get(['gemini_key', 'language'])
      const key = st?.['gemini_key'] ?? ''
      const targetLanguage = st?.['language'] ?? 'simplified chinese'

      try {
        const res = (await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
          {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: {
                parts: { text: instruction }
              },
              contents: {
                parts: { text: JSON.stringify({ targetLanguage, inputText: message.text }) }
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
    Promise.all([
      baiduDetectLang(message.text),
      chrome.storage.sync.get(['language']).then(v => v['language'] as string)
    ]).then(r => {
      sendResponse({ same: langsMap[r[0]] === r[1], lang: langsMap[r[0]] })
    })
    return true
  }
})

const baiduDetectLang = async (text: string) => {
  const url = `https://fanyi.baidu.com/langdetect?${new URLSearchParams({ query: text }).toString()}`
  try {
    const res = (await (await fetch(url, { method: 'post', signal: AbortSignal.timeout(1000) })).json()) as {
      lan: string
    }
    return res.lan ?? 'en'
  } catch (e) {
    return 'en'
  }
}
