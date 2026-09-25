import { type MetadataRoute } from 'next'

export default function manifest (): MetadataRoute.Manifest {
	return {
		name: 'Gaslight',
		short_name: 'Gaslight',
		start_url: '/',
		display: 'standalone',
		background_color: '#fff',
		theme_color: '#fff',
		icons: [
			{
				src: '/icon.svg',
				sizes: 'any',
				type: 'image/svg+xml'
			}
		]
	}
}
