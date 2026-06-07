let lastEditor: HTMLTextAreaElement | HTMLInputElement | null = null

function isEditable(
  el: Element | null
): el is HTMLTextAreaElement | HTMLInputElement {
  return (
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLInputElement
  )
}

export function trackEditorFocus() {

  document.addEventListener("focusin", (e) => {

    const el = e.target as Element | null

    if (isEditable(el)) {
      lastEditor = el
    }
  })
}

export function getActiveOrLastEditor() {

  const active = document.activeElement

  if (isEditable(active)) {
    lastEditor = active
    return active
  }

  return lastEditor
}

export function restoreEditorFocus() {
  const el = getActiveOrLastEditor()
  el?.focus()
}
