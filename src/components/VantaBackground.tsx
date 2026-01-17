import { ReactElement, useEffect, useRef } from 'react'
import * as THREE from 'three'
import HALO from 'vanta/dist/vanta.halo.min.js'
import NET from 'vanta/dist/vanta.net.min.js'

export const HaloCalm = (): ReactElement<any> => {
	const vantaRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		let vantaEffect: any = null
		if (vantaRef.current !== null) {
			vantaEffect = HALO({
				el: vantaRef.current,
				mouseControls: true,
				touchControls: true,
				gyroControls: false,
				minHeight: 200.0,
				minWidth: 200.0,
				baseColor: 0xf9202c,
				backgroundColor: 0x60610,
				amplitudeFactor: 1.0,
				size: 2,
				THREE
			})
		}

		return () => {
			if (vantaEffect !== null) { vantaEffect.destroy() }
		}
	}, [])

	return <div ref={vantaRef} className="w-full h-full" />
}

export const HaloAggressive = (): ReactElement<any> => {
	const vantaRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		let vantaEffect: any = null
		if (vantaRef.current !== null) {
			vantaEffect = HALO({
				el: vantaRef.current,
				mouseControls: true,
				touchControls: true,
				gyroControls: false,
				minHeight: 200.0,
				minWidth: 200.0,
				baseColor: 0xf9202c,
				backgroundColor: 0x60610,
				amplitudeFactor: 10.0,
				size: 3,
				THREE
			})
		}

		return () => {
			if (vantaEffect !== null) { vantaEffect.destroy() }
		}
	}, [])

	return <div ref={vantaRef} className="w-full h-full" />
}

export const Net = (): ReactElement<any> => {
	const vantaRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		let vantaEffect: any = null
		if (vantaRef.current !== null) {
			vantaEffect = NET({
				el: vantaRef.current,
				mouseControls: true,
				touchControls: true,
				gyroControls: false,
				minHeight: 200.00,
				minWidth: 200.00,
				scale: 1.00,
				scaleMobile: 1.00,
				color: 0xbd7a43,
				backgroundColor: 0x29262c,
				points: 16.00,
				maxDistance: 18.00,
				spacing: 19.00,
				showDots: false,
				THREE
			})
		}

		return () => {
			if (vantaEffect !== null) { vantaEffect.destroy() }
		}
	}, [])

	return <div ref={vantaRef} className="w-full h-full" />
}
