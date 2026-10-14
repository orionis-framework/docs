function restoreActiveNavigation() {
    // Keep the native Starlight title link: it returns to this locale's docs.
    // Restore the active section even if a previous visit collapsed it.
    const sidebar = document.getElementById('starlight__sidebar');
    const current = sidebar?.querySelector('a[aria-current="page"]');
    if (!sidebar) return;
    for (const section of sidebar.querySelectorAll('.sidebar-section')) {
        section.open = Boolean(current && section.contains(current));
    }
    if (!current) return;
    let group = current.closest('details');
    while (group) {
        group.open = true;
        group = group.parentElement?.closest('details');
    }
    if (!matchMedia('(min-width: 50em)').matches) return;
    const panel = sidebar.getBoundingClientRect();
    const link = current.getBoundingClientRect();
    if (link.top < panel.top || link.bottom > panel.bottom) {
        sidebar.scrollTop += link.top - panel.top - panel.height / 3;
    }
}

document.addEventListener('DOMContentLoaded', restoreActiveNavigation);
window.addEventListener('pageshow', (event) => {
    if (event.persisted) restoreActiveNavigation();
});
