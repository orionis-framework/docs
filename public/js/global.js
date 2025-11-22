document.addEventListener('DOMContentLoaded', () => {

    // Redirect site title click to the main website
    const title = document.querySelector('.site-title');
    if (title) {
        title.addEventListener('click', (e) => {
            e.preventDefault();
            globalThis.location.replace('https://orionis-framework.com');
        });
    }
});
