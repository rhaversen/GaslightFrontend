export const formatDuration = (milliseconds: number): string => {
	const seconds = milliseconds / 1000
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const remainingSeconds = seconds % 60

	if (hours > 0) {
		return `${hours}h ${minutes}m ${remainingSeconds.toFixed(2)}s`
	}
	if (minutes > 0) {
		return `${minutes}m ${remainingSeconds.toFixed(2)}s`
	}
	return `${remainingSeconds.toFixed(2)}s`
}
