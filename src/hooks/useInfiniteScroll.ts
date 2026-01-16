import { useEffect, useRef } from 'react'

export function useInfiniteScroll (
	callback: () => void,
	isLoading: boolean,
	hasMore: boolean
) {
	const observerTarget = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const target = observerTarget.current
		if (!target || isLoading || !hasMore) { return }

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					callback()
				}
			},
			{ rootMargin: '100px' }
		)

		observer.observe(target)
		return () => observer.disconnect()
	}, [callback, isLoading, hasMore])

	return observerTarget
}
