// Deliberate CodeQL probe on a throwaway branch (never merged): a URL parameter
// written straight into innerHTML, which CodeQL reports as DOM-based XSS.
export function showProbeName() {
    const name = new URLSearchParams(window.location.search).get('name');
    const el = document.getElementById('probe');
    if (el) el.innerHTML = name ?? '';
}
