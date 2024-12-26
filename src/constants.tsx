export const langs = [
  'chinese',
  'traditional chinese',
  'english',
  'japanese',
  'korean',
  'french',
  'spanish',
  'russian',
  'german',
  'italian',
  'turkish',
  'portuguese',
  'vietnamese',
  'indonesian',
  'thai',
  'arabic',
  'hindi',
  'persian'
]

export const langsMap = [
  'zh',
  'cht',
  'en',
  'jp',
  'kor',
  'fra',
  'spa',
  'ru',
  'de',
  'it',
  'tr',
  'pt',
  'vie',
  'id',
  'th',
  'ar',
  'hi',
  'per'
].reduce((acc, cur, idx) => {
  acc[cur] = langs[idx]
  return acc
}, {} as Record<string, string>)
