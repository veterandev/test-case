export function insertIntoFocusedEditor(text){

    const el = document.activeElement;

    if(!el) return;

    if(el.tagName === "TEXTAREA" || el.tagName === "INPUT"){

        const start = el.selectionStart;
        const end = el.selectionEnd;

        el.value =
            el.value.substring(0,start) +
            text +
            el.value.substring(end);

        el.selectionStart = el.selectionEnd = start + text.length;
    }
}
