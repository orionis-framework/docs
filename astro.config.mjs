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
			tableOfContents: {
				minHeadingLevel: 2,
				maxHeadingLevel: 4,
			},
			sidebar: [
				{
					label: '📚 Introduction',
					collapsed: false,
					translations: {
						es: '📚 Introducción',
					},
					items: [
						{
							label: '📄 Prologue',
							slug: 'introduction/prologue',
							translations: {
								es: '📄 Prólogo',
							},
						},
						{
							label: '📄 Versions',
							slug: 'introduction/versions',
							translations: {
								es: '📄 Versiones',
							},
						},
					],
				},
				{
					label: '🚩 Getting Started',
					collapsed: true,
					translations: {
						es: '🚩 Primeros Pasos'
					},
					items: [
						{
							label: '📝 Installation',
							slug: 'getting-started/installation',
							translations: {
								es: '📝 Instalación',
							},
						},
						{
							label: '📄 Configuration',
							slug: 'getting-started/configuration',
							translations: {
								es: '📄 Configuración',
							},
						},
						{
							label: '📄 Project Structure',
							slug: 'getting-started/project-structure',
							translations: {
								es: '📄 Estructura Del Proyecto',
							},
						},
						{
							label: '📝 Deployment',
							slug: 'getting-started/deployment',
							translations: {
								es: '📝 Despliegue',
							},
						},
					],
				},
				{
					label: '🏛️ Architecture',
					collapsed: true,
					translations: {
						es: '🏛️ Arquitectura'
					},
					items: [
						{
							label: '📄 Request Lifecycle',
							slug: 'architecture/request-lifecycle',
							translations: {
								es: '📄 Ciclo de vida de la petición',
							},
						},
						{
							label: '📄 Service Container',
							slug: 'architecture/service-container',
							translations: {
								es: '📄 Contenedor de servicios',
							},
						},
						{
							label: '📄 Service Providers',
							slug: 'architecture/service-providers',
							translations: {
								es: '📄 Proveedores de servicios',
							},
						},
						{
							label: '📄 Facades',
							slug: 'architecture/facades',
							translations: {
								es: '📄 Facades',
							},
						},
					],
				},
				{
					label: '💻 Console & Commands',
					collapsed: true,
					translations: {
						es: '💻 Consola y Comandos'
					},
					items: [
						{
							label: '📄 Reactor CLI',
							slug: 'console/reactor',
							translations: {
								es: '📄 Reactor CLI',
							},
						},
						{
							label: '📄 Native Commands',
							slug: 'console/native-commands',
							translations: {
								es: '📄 Comandos Nativos',
							},
						},
						{
							label: '📄 Custom Commands',
							slug: 'console/custom-commands',
							translations: {
								es: '📄 Comandos Personalizados',
							},
						},
						{
							label: '📄 Command Routing',
							slug: 'console/command-routing',
							translations: {
								es: '📄 Rutas de Comandos',
							},
						},
						{
							label: '📄 Task Scheduler',
							slug: 'console/task-scheduler',
							translations: {
								es: '📄 Programador de Tareas',
							},
						},
						{
							label: '📄 Facade',
							slug: 'console/facade',
							translations: {
								es: '📄 Fachada',
							},
						},
						{
							label: '📄 Exceptions & Error Handling',
							slug: 'console/exceptions-error-handling',
							translations: {
								es: '📄 Excepciones y Manejo de Errores',
							},
						},
						{
							label: '📄 Lifespan Events',
							slug: 'console/lifespan',
							translations: {
								es: '📄 Eventos de Ciclo de Vida',
							},
						},
					],
				},
				{
					label: '🌐 HTTP & Requests',
					collapsed: true,
					translations: {
						es: '🌐 HTTP y Peticiones'
					},
					items: [
						{
							label: '📄 Overview',
							slug: 'http/overview',
							translations: {
								es: '📄 Descripción General',
							},
						},
					],
				},
				{
					label: '🧩 Services',
					collapsed: true,
					translations: {
						es: '🧩 Servicios'
					},
					items: [
						{
							label: '📄 Encrypter',
							slug: 'services/encrypter',
							translations: {
								es: '📄 Cifrador'
							}
						},
						{
							label: '📄 Environment',
							slug: 'services/environment',
							translations: {
								es: '📄 Entorno'
							}
						},
						{
							label: '📄 File Based Cache',
							slug: 'services/file_based_cache',
							translations: {
								es: '📄 Cache Basada en Archivos'
							}
						},
						{
							label: '📄 Logging',
							slug: 'services/logging',
							translations: {
								es: '📄 Logging'
							}
						},
					],
				},
				{
					label: '🧰 Helpers & Utilities',
					collapsed: true,
					translations: {
						es: '🧰 Utilidades y Ayudantes'
					},
					items: [
						{
							label: '📄 Metadata',
							slug: 'helpers/metadata',
							translations: {
								es: '📄 Metadatos'
							},
						},
						{
							label: '📄 Inspirational',
							slug: 'helpers/inspirational',
							translations: {
								es: '📄 Inspiración'
							},
							badge: {
								text: 'No-op',
								variant: 'note',
							}
						},
						{
							label: '📄 Workers',
							slug: 'helpers/workers',
							translations: {
								es: '📄 Workers'
							},
						},
						{
							label: '📄 Stringable',
							slug: 'helpers/stringable',
							translations: {
								es: '📄 Stringable'
							},
						},
						{
							label: '📄 DotDict',
							slug: 'helpers/dot-dict',
							translations: {
								es: '📄 DotDict'
							},
						},
						{
							label: '📄 FreezeThaw',
							slug: 'helpers/freeze-thaw',
							translations: {
								es: '📄 FreezeThaw'
							},
						},
						{
							label: '📄 Collection',
							slug: 'helpers/collection',
							translations: {
								es: '📄 Collection'
							},
						},
						{
							label: '📄 StdClass',
							slug: 'helpers/std-class',
							translations: {
								es: '📄 StdClass'
							},
						}
					],
				},
				{
					label: '🧠 Reflection',
					collapsed: true,
					translations: {
						es: '🧠 Reflexión'
					},
					items: [
						{
							label: '📄 Overview',
							slug: 'reflection/overview',
							translations: {
								es: '📄 Descripción General'
							},
						},
						{
							label: '📄 Abstract Classes',
							slug: 'reflection/abstract',
							translations: {
								es: '📄 Clases Asbtractas'
							},
						},
						{
							label: '📄 Callables',
							slug: 'reflection/callables',
							translations: {
								es: '📄 Invocables'
							},
						},
						{
							label: '📄 Concrete Classes',
							slug: 'reflection/concretes',
							translations: {
								es: '📄 Clases Concretas'
							},
						},
						{
							label: '📄 Instances',
							slug: 'reflection/instances',
							translations: {
								es: '📄 Instancias'
							},
						},
						{
							label: '📄 Modules',
							slug: 'reflection/modules',
							translations: {
								es: '📄 Módulos'
							},
						},
						{
							label: '📄 Dependencies',
							slug: 'reflection/dependencies',
							translations: {
								es: '📄 Dependencias'
							},
						},
						{
							label: '📄 Inspection',
							slug: 'reflection/inspect',
							translations: {
								es: '📄 Inspección'
							},
						},
					],
				},
				{
					label: '🤝 Contribute',
					collapsed: true,
					translations: {
						es: '🤝 Contribuir'
					},
					items: [
						{
							label: '📄 Contribution Guide',
							slug: 'contribute/guide',
							translations: {
								es: '📄 Guía de contribución',
							},
						},
						{
							label: '📄 Contributors',
							link: '/contribute/contributors',
							translations: {
								es: '📄 Colaboradores',
							},
						},
					],
				},
			],
		})
	],
});
