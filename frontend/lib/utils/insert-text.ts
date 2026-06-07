import {
  restoreEditorFocus,
  getActiveOrLastEditor,
} from "./editor-focus"

export function insertIntoFocusedEditor(text: string) {

  const el = getActiveOrLastEditor()
  if (!el) return

  restoreEditorFocus()

  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? el.value.length

  const newValue =
    el.value.slice(0, start) +
    text +
    el.value.slice(end)

  const prototype = Object.getPrototypeOf(el)

  const valueSetter =
    Object.getOwnPropertyDescriptor(
      prototype,
      "value"
    )?.set

  if (valueSetter) {
    valueSetter.call(el, newValue)
  } else {
    el.value = newValue
  }

  const pos = start + text.length
  el.setSelectionRange(pos, pos)

  el.dispatchEvent(
    new Event("input", { bubbles: true })
  )
}
