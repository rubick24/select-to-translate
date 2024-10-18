chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const text = message.text
  const fn = async () => {
    // TODO: make actual requests here
    await new Promise(r => setTimeout(r, 1000))
    return 'response ' + text
  }

  fn().then(sendResponse)
  return true
})
