declare module 'vanta/dist/vanta.halo.min.js' {
	const HALO: (options: Record<string, unknown>) => { destroy: () => void }
	export default HALO
}

declare module 'vanta/dist/vanta.net.min.js' {
	const NET: (options: Record<string, unknown>) => { destroy: () => void }
	export default NET
}
