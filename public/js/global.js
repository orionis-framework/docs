document.addEventListener('DOMContentLoaded', () => {

    // Redirect site title click to official website
    const title = document.querySelector('.site-title');
    if (title) {
        title.addEventListener('click', (e) => {
            e.preventDefault();
            globalThis.location.href = 'https://orionis-framework.com';
        });
    }

});