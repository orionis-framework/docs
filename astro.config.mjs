// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	redirects: {
		'/': '/en/introduction/prologue',
		'/en/': '/en/introduction/prologue',
		'/es/': '/es/introduction/prologue',
	},
	integrations: [
		starlight({
			title: 'Orionis Framework',
			logo: {
				src: './public/favicon.svg',
			},
			defaultLocale: 'en',
			editLink: {
				baseUrl: 'https://github.com/orionis-framework/docs/edit/master/',
			},
			customCss: [
				'./src/styles/custom.css',
			],
			components: {
				Search: '@astrojs/starlight/components/Search.astro',
				Head: './src/components/Head.astro',
			},
			locales: {
				en: {
					label: 'English',
					lang: 'en',
				},
				es: {
					label: 'Español',
					lang: 'es',
				},
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/orionis-framework' },
				{ icon: 'discord', label: 'Discord', href: '#' }
			],
			sidebar: [
				{
					label: '📚 Introduction',
					collapsed: false,
					translations: {
						es: '📚 Introducción',
					},
					items: [
						{
							label: 'Prologue',
							slug: 'introduction/prologue',
							translations: {
								es: 'Prólogo',
							},
						},
						{
							label: 'Versions',
							slug: 'introduction/versions',
							translations: {
								es: 'Versiones',
							},
						},
					],
				},
				{
					label: '🛠️ Installation',
					collapsed: false,
					translations: {
						es: '🛠️ Instalación'
					},
					items: [
						{
							label: 'Prerequisites',
							slug: 'installation/prerequisites',
							translations: {
								es: 'Prerrequisitos',
							},
						},
						{
							label: 'Installation Steps',
							slug: 'installation/steps',
							translations: {
								es: 'Pasos de Instalación',
							},
						},
					],
				},
				{
					label: '🤝 Contribute',
					collapsed: false,
					translations: {
						es: '🤝 Contribuir'
					},
					items: [
						{
							label: 'Contribution Guide',
							slug: 'contribute/guide',
							translations: {
								es: 'Guía de Contribución',
							},
						},
						{
							label: 'Contributors',
							slug: 'contribute/contributors',
							translations: {
								es: 'Contribuidores',
							},
						},
					],
				},
			],
		})
	],
});
