// Deliberate CodeQL probe on a throwaway branch (never merged): a URL parameter
// Deliberate CodeQL probe on a throwaway branch (never merged). Fixed: the URL
// parameter is now written as text, not HTML.
    const name = new URLSearchParams(window.location.search).get('name');
    const el = document.getElementById('probe');
    if (el) el.textContent = name ?? '';
}
