import { app } from "./app";

export const header = [

    // Stylesheets
    ['link', { rel: 'stylesheet', href: '/css/style.css' }],
    ['link', { rel: 'icon', href: app?.favicon ?? 'favicon.ico' }],

    // Open Graph Metadata
    ['meta', { property: 'og:image', content: 'og/image.png' }],
    ['meta', { property: 'og:image:secure_url', content: 'og/image.png' }],
    ['meta', { property: 'og:image:width', content: '600' }],
    ['meta', { property: 'og:image:height', content: '400' }],
    ['meta', { property: 'og:title', content: app.name }],
    ['meta', { property: 'og:description', content: app.description }],
    ['meta', { property: 'og:url', content: app.links.website }],
    ['meta', { property: 'og:type', content: 'website' }]

];