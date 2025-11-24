// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.orionis-framework.com',
	redirects: {
		'/': '/en/introduction/prologue',
		'/en/': '/en/introduction/prologue',
		'/es/': '/es/introduction/prologue',
	},
	integrations: [
		sitemap(),
		starlight({
			title: 'Orionis Framework',
			description: 'Framework revolucionario para desarrollo full-stack con PHP y Python. Construye sin límites con RPA, IA, Blockchain y más.',
			logo: {
				src: './public/favicon.svg',
			},
			favicon: '/favicon.svg',
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
					label: '🚩 Getting Started',
					collapsed: false,
					translations: {
						es: '🚩 Primeros Pasos'
					},
					items: [
						{
							label: 'Installation',
							slug: 'getting-started/installation',
							translations: {
								es: 'Instalación',
							},
						},
						{
							label: 'Configuration',
							slug: 'getting-started/configuration',
							translations: {
								es: 'Configuración',
							},
						},
						{
							label: 'Project Structure',
							slug: 'getting-started/project-structure',
							translations: {
								es: 'Estructura-del-proyecto',
							},
						},
						{
							label: 'Deployment',
							slug: 'getting-started/deployment',
							translations: {
								es: 'Despliegue',
							},
						},
					],
				},
				{
					label: '🏛️ Architecture Concepts',
					collapsed: false,
					translations: {
						es: '🏛️ Conceptos de Arquitectura'
					},
					items: [
						{
							label: 'Request Lifecycle',
							slug: 'architecture/request-lifecycle',
							translations: {
								es: 'Ciclo de vida de la petición',
							},
						},
						{
							label: 'Service Container',
							slug: 'architecture/service-container',
							translations: {
								es: 'Contenedor de servicios',
							},
						},
						{
							label: 'Service Providers',
							slug: 'architecture/service-providers',
							translations: {
								es: 'Proveedores de servicios',
							},
						},
						{
							label: 'Facades',
							slug: 'architecture/facades',
							translations: {
								es: 'Facades',
							},
						},
					],
				},
				{
					label: '💻 Console & Commands',
					collapsed: false,
					translations: {
						es: '💻 Consola y Comandos'
					},
					items: [
						{
							label: 'Native Commands',
							slug: 'console/native-commands',
							translations: {
								es: 'Comandos Nativos',
							},
						},
						{
							label: 'Custom Commands',
							slug: 'console/custom-commands',
							translations: {
								es: 'Comandos Personalizados',
							},
						},
						{
							label: 'Command Routing',
							slug: 'console/command-routing',
							translations: {
								es: 'Rutas de Comandos',
							},
						},
						{
							label: 'Task Scheduler',
							slug: 'console/task-scheduler',
							translations: {
								es: 'Programador de Tareas',
							},
						},
						{
							label: 'Events & Listeners',
							slug: 'console/events-listeners',
							translations: {
								es: 'Eventos y Listeners',
							},
						},
						{
							label: 'Exceptions & Error Handling',
							slug: 'console/exceptions-error-handling',
							translations: {
								es: 'Excepciones y Manejo de Errores',
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
								es: 'Guía de contribución',
							},
						},
						{
							label: 'Contributors',
							slug: 'contribute/contributors',
							translations: {
								es: 'Colaboradores',
							},
						},
					],
				},
			],
		})
	],
});
