import React, { useState, useEffect, useRef, ReactElement } from 'react'
import Editor, { type Monaco } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { shikiToMonaco } from '@shikijs/monaco'
import { createHighlighter } from 'shiki'

const apiTypes = `/**
 * Possible scores in Meyer:
 *
 * Special scores
 * 1000, 999 (Meyer and Lille Meyer)
 * 
 *
 * Pairs
 * 600, 500, 400, 300, 200, 100
 * 
 * Regular scores
 * 65, 64, 63, 62, 61
 * 54, 53, 52, 51
 * 43, 42, 41
 * 32
*/

interface MeyerStrategyAPI {
	/**
	 * @param dice - A pair of dice
	 * @returns The score of the dice
	 * @description
	 * Will always return the highest possible score for the given dice.
	 */
	calculateDieScore: (dice: [number, number]) => number;
	/**
	 * @returns Array of newest to oldest previous actions
	 * @description
	 * Will only reveal the announced value (possible lie) of the previous actions.
	 * The value of the action is the calculated score of the dice.
	 * If there are no previous actions, null will be returned.
	 * If the player has already rolled the dice, the previous action will be the roll action.
	 */
	getPreviousActions: () => number[] | null;
	/**
	 * @returns The previous action
	 * @description
	 * Will only reveal the announced value (possible lie) of the previous action.
	 * The value of the action is the calculated score of the dice.
	 * If there are no previous actions, null will be returned.
	 * If the player has already rolled the dice, the previous action will be the roll action.
	 */
	getPreviousAction: () => number | null;
	/**
	 * @param score - The score to round up
	 * @returns The rounded up score
	 * @description
	 * Rounds up the score to the nearest valid score.
	 */
	roundUpToValidScore: (score: number) => number;
	/**
	 * @returns Whether the player is the first in the round
	 */
	isFirstInRound: () => boolean;
	/**
	 * @description
	 * Ends the turn by rolling the dice while hiding the result from both the current player and the other players.
	 * The announced value will be the score of the previous action (Essentially betting that the hidden score is higher than or equal to the previous action).
	 * Can only be called once per turn and only if the player is not the first in the round. Can only be called after the player has rolled the dice.
	 */
	detEllerDerover: () => void;
	/**
	 * @description
	 * Ends the turn by revealing the previous action and penalizes the player who lied.
	 * If the previous player did not lie, the current player will be penalized.
	 * Revealing a true "Meyer" score will cause double penalty to the revealing player. Revealing a false "Meyer" score will cause double penalty to the liar (Previous player).
	 * Can only be called once per turn and only if the player is not the first in the round. Can only be called after the player has rolled the dice.
	 */
	reveal: () => void;
	/**
	 * @returns The score of the dice
	 * @description
	 * Rolls the dice and returns the score of the dice. Can only be called once per turn.
	 */
	roll: () => number;
	/**
	 * @description
	 * Ends the turn by announcing a score and passing the turn to the next player.
	 * The lie value must be equal to or higher than the previously announced value. Lying about "Meyer" score will cause double penalty if caught.
	 * Can only be called once per turn. Can only be called after the player has rolled the dice.
	 */
	lie: (value: number) => void;
}`

// Commented out themes are found to be not working with Shiki 1.27.2
// https://shiki.style/themes#bundled-themes
const MONACO_THEMES = [
	{ label: 'Andromeeda', value: 'andromeeda', bg: '23262e' },
	{ label: 'Aurora X', value: 'aurora-x', bg: '07090f' },
	{ label: 'Ayu Dark', value: 'ayu-dark', bg: '0b0e14' },
	{ label: 'Catppuccin Frappé', value: 'catppuccin-frappe', bg: '303446' },
	{ label: 'Catppuccin Latte', value: 'catppuccin-latte', bg: 'eff1f5' },
	{ label: 'Catppuccin Macchiato', value: 'catppuccin-macchiato', bg: '24273a' },
	{ label: 'Catppuccin Mocha', value: 'catppuccin-mocha', bg: '1e1e2e' },
	{ label: 'Dark Plus', value: 'dark-plus', bg: '1e1e1e' },
	{ label: 'Dracula Theme', value: 'dracula', bg: '282a36' },
	{ label: 'Dracula Theme Soft', value: 'dracula-soft', bg: '282a36' },
	{ label: 'Everforest Dark', value: 'everforest-dark', bg: '2d353b' },
	{ label: 'Everforest Light', value: 'everforest-light', bg: 'fdf6e3' },
	{ label: 'GitHub Dark', value: 'github-dark', bg: '24292e' },
	// { label: 'GitHub Dark Default', value: 'github-dark-default' },
	// { label: 'GitHub Dark Dimmed', value: 'github-dark-dimmed' },
	// { label: 'GitHub Dark High Contrast', value: 'github-dark-high-contrast' },
	{ label: 'GitHub Light', value: 'github-light', bg: 'ffffff' },
	{ label: 'GitHub Light Default', value: 'github-light-default', bg: 'ffffff' },
	{ label: 'GitHub Light High Contrast', value: 'github-light-high-contrast', bg: 'ffffff' },
	{ label: 'Houston', value: 'houston', bg: '17191e' },
	{ label: 'Kanagawa Dragon', value: 'kanagawa-dragon', bg: '181616' },
	{ label: 'Kanagawa Lotus', value: 'kanagawa-lotus', bg: 'f2ecbc' },
	{ label: 'Kanagawa Wave', value: 'kanagawa-wave', bg: '1f1f28' },
	{ label: 'LaserWave', value: 'laserwave', bg: '27212e' },
	{ label: 'Light Plus', value: 'light-plus', bg: 'ffffff' },
	{ label: 'Material Theme', value: 'material-theme', bg: '263238' },
	{ label: 'Material Theme Darker', value: 'material-theme-darker', bg: '212121' },
	{ label: 'Material Theme Lighter', value: 'material-theme-lighter', bg: 'fafafa' },
	{ label: 'Material Theme Ocean', value: 'material-theme-ocean', bg: '0f111a' },
	{ label: 'Material Theme Palenight', value: 'material-theme-palenight', bg: '292d3e' },
	{ label: 'Min Dark', value: 'min-dark', bg: '1f1f1f' },
	{ label: 'Min Light', value: 'min-light', bg: 'ffffff' },
	{ label: 'Monokai', value: 'monokai', bg: '272822' },
	{ label: 'Night Owl', value: 'night-owl', bg: '011627' },
	{ label: 'Nord', value: 'nord', bg: '2e3440' },
	{ label: 'One Dark Pro', value: 'one-dark-pro', bg: '282c34' },
	{ label: 'One Light', value: 'one-light', bg: 'fafafa' },
	{ label: 'Plastic', value: 'plastic', bg: '21252b' },
	{ label: 'Poimandres', value: 'poimandres', bg: '1b1e28' },
	{ label: 'Red', value: 'red', bg: '390000' },
	{ label: 'Rosé Pine', value: 'rose-pine', bg: '191724' },
	{ label: 'Rosé Pine Dawn', value: 'rose-pine-dawn', bg: 'faf4ed' },
	{ label: 'Rosé Pine Moon', value: 'rose-pine-moon', bg: '232136' },
	{ label: 'Slack Dark', value: 'slack-dark', bg: '222222' },
	{ label: 'Slack Ochin', value: 'slack-ochin', bg: 'ffffff' },
	{ label: 'Snazzy Light', value: 'snazzy-light', bg: 'fafbfc' },
	{ label: 'Solarized Dark', value: 'solarized-dark', bg: '002b36' },
	{ label: 'Solarized Light', value: 'solarized-light', bg: 'fdf6e3' },
	{ label: 'Synthwave \'84', value: 'synthwave-84', bg: '262335' },
	{ label: 'Tokyo Night', value: 'tokyo-night', bg: '1a1b26' },
	// { label: 'Vesper', value: 'vesper' },
	{ label: 'Vitesse Black', value: 'vitesse-black', bg: '000000' },
	{ label: 'Vitesse Dark', value: 'vitesse-dark', bg: '121212' },
	{ label: 'Vitesse Light', value: 'vitesse-light', bg: 'ffffff' }
] as const

async function initializeShiki (monaco: Monaco): Promise<void> {
	const highlighter = await createHighlighter({
		themes: MONACO_THEMES.map(theme => theme.value),
		langs: ['typescript']
	})

	// Register the languages
	monaco.languages.register({ id: 'typescript' })

	// Register Shiki themes
	shikiToMonaco(highlighter, monaco)
}

const MonacoEditor = ({
	defaultValue,
	value,
	height = '90vh',
	onChange,
	onToggleMaximize,
	isMaximized
}: {
	defaultValue?: string
	value?: string
	height?: string
	onChange?: (value: string | undefined, event: any) => void
	onToggleMaximize?: () => void
	isMaximized?: boolean
}): ReactElement<any> => {
	const monacoRef = useRef<Monaco | null>(null)
	const extraLibDisposableRef = useRef<monaco.IDisposable | null>(null)
	const [theme, setTheme] = useState<typeof MONACO_THEMES[number]['value']>('github-dark')
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [leftPaneWidth, setLeftPaneWidth] = useState('60%')
	const [topPaneHeight, setTopPaneHeight] = useState('50%')
	const isDraggingRef = useRef(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const [showMinimap, setShowMinimap] = useState(true)
	const [showDocumentation, setShowDocumentation] = useState(true)
	const [preferVerticalLayout, setPreferVerticalLayout] = useState(false)

	// Layout state
	const [screenWidth, setScreenWidth] = useState(window.innerWidth)
	const isSmallScreen = screenWidth < 500
	const isVerticalLayout = isSmallScreen || preferVerticalLayout

	const bgColor = MONACO_THEMES.find(t => t.value === theme)?.bg ?? 'ffffff'
	// Determine high-contrast color based on background color
	const highContrast = isLightBackground(bgColor) ? '#000000' : '#ffffff'

	useEffect(() => {
		const handleResize = (): void => {
			const width = window.innerWidth
			setScreenWidth(width)
			if (width < 500) {
				setLeftPaneWidth('100%')
			} else {
				setLeftPaneWidth('60%')
			}
		}

		handleResize()
		window.addEventListener('resize', handleResize)
		return () => { window.removeEventListener('resize', handleResize) }
	}, [])

	// Add function to determine if background is light
	function isLightBackground (hex: string): boolean {
		const rgb = parseInt(hex, 16)
		const r = (rgb >> 16) & 0xff
		const g = (rgb >> 8) & 0xff
		const b = (rgb >> 0) & 0xff
		const brightness = (r * 299 + g * 587 + b * 114) / 1000
		return brightness > 128
	}

	useEffect(() => {
		const handleEscape = (event: KeyboardEvent): void => {
			if (event.key === 'Escape' && isFullscreen) {
				setIsFullscreen(false)
			}
		}
		window.addEventListener('keydown', handleEscape)
		return () => {
			window.removeEventListener('keydown', handleEscape)
		}
	}, [isFullscreen])

	useEffect(() => {
		if (monacoRef.current === null) return

		// Cleanup previous lib if it exists
		if (extraLibDisposableRef.current !== null) {
			extraLibDisposableRef.current.dispose()
			extraLibDisposableRef.current = null
		}

		if (!showDocumentation) {
			// Add types when docs are hidden
			extraLibDisposableRef.current = monacoRef.current.languages.typescript.typescriptDefaults.addExtraLib(
				apiTypes,
				'ts:filename/MeyerStrategyAPI.d.ts'
			)
		}

		return () => {
			if (extraLibDisposableRef.current !== null) {
				extraLibDisposableRef.current.dispose()
				extraLibDisposableRef.current = null
			}
		}
	}, [showDocumentation])

	useEffect(() => {
		if (isFullscreen) {
			document.documentElement.style.overflow = 'hidden'
		} else {
			document.documentElement.style.overflow = ''
		}
	}, [isFullscreen])

	function handleEditorChange (value: string | undefined, event: monaco.editor.IModelContentChangedEvent): void {
		if (onChange !== null && onChange !== undefined) {
			onChange(value, event)
		}
	}

	function handleEditorWillMount (monaco: Monaco): void {
		monacoRef.current = monaco
		initializeShiki(monaco)
			.then(() => {
				monaco.editor.setTheme(theme)
			})
			.catch(console.error)
	}

	function handleEditorDidMount (editor: monaco.editor.IStandaloneCodeEditor): void {
		editor.updateOptions({ theme })
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function handleEditorValidation (_markers: monaco.editor.IMarker[]): void {
		// model markers
		// markers.forEach(marker => console.log('onValidate:', marker.message));
	}

	function toggleFullscreen (): void {
		setIsFullscreen(!isFullscreen)
	}

	const handleMouseDown = (e: React.MouseEvent): void => {
		e.preventDefault() // Prevent text selection
		isDraggingRef.current = true
		setShowMinimap(false)

		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseup', handleMouseUp)
		// Prevent text selection during drag
		document.body.style.userSelect = 'none'
		document.body.style.cursor = isVerticalLayout ? 'ns-resize' : 'ew-resize'
	}

	const handleMouseMove = (e: MouseEvent): void => {
		if (!isDraggingRef.current || containerRef.current === null) return

		const containerRect = containerRef.current.getBoundingClientRect()

		if (isVerticalLayout) {
			const mouseY = e.clientY - containerRect.top
			const percentage = (mouseY / containerRect.height) * 100
			const clampedPercentage = Math.min(Math.max(percentage, 20), 80)
			setTopPaneHeight(`${clampedPercentage}%`)
		} else {
			const mouseX = e.clientX - containerRect.left
			const percentage = (mouseX / containerRect.width) * 100
			const clampedPercentage = Math.min(Math.max(percentage, 20), 80)
			setLeftPaneWidth(`${clampedPercentage}%`)
		}
	}

	const handleMouseUp = (): void => {
		isDraggingRef.current = false
		setShowMinimap(true)
		document.removeEventListener('mousemove', handleMouseMove)
		document.removeEventListener('mouseup', handleMouseUp)
		// Restore text selection and cursor
		document.body.style.userSelect = ''
		document.body.style.cursor = ''
	}

	return (
		<div
			className={`flex flex-col ${isFullscreen ? 'fixed top-0 left-0 w-screen h-screen z-[9999]' : 'rounded-md shadow-md'
			}`}
			style={{ backgroundColor: `#${bgColor}`, height: isFullscreen ? '100vh' : 'auto' }}
		>
			<div className="flex flex-wrap justify-end gap-2 p-2">
				<label htmlFor="theme-select" className="sr-only">{'Select Theme'}</label>
				<select
					id="theme-select"
					value={theme}
					onChange={(e) => { setTheme(e.target.value as typeof theme) }}
					className="bg-gray-700 text-white px-3 py-1 rounded-md"
				>
					{MONACO_THEMES.map(({ label, value }) => (
						<option key={value} value={value}>{label}</option>
					))}
				</select>
				<button
					type="button"
					onClick={() => { setShowDocumentation(prev => !prev) }}
					className="bg-gray-700 text-white px-3 py-1 rounded-md"
				>
					{showDocumentation ? 'Hide Docs' : 'Show Docs'}
				</button>
				{/* Remove button from top toolbar: */}
				{onToggleMaximize !== null && onToggleMaximize !== undefined && (
					<button
						type='button'
						onClick={onToggleMaximize}
						className="bg-gray-700 text-white px-3 py-1 rounded-md"
						title={isMaximized === true ? 'Minimize' : 'Maximize'}
					>
						{isMaximized === true
							? (
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 14h7m0 0v7m0-7l-7 7m17-11h-7m0 0V3m0 7l7-7" />
								</svg>
							)
							: (
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
								</svg>
							)}
					</button>
				)}
				<button
					type="button"
					onClick={toggleFullscreen}
					className="bg-gray-700 text-white px-3 py-1 rounded-md"
				>
					{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
				</button>
			</div>
			<div className={`flex ${isVerticalLayout ? 'flex-col' : ''} gap-1 relative`}
				ref={containerRef}
				style={{ height: isFullscreen ? 'calc(100%)' : height }}
			>
				<div style={{
					width: isVerticalLayout ? '100%' : (showDocumentation ? leftPaneWidth : '100%'),
					height: isVerticalLayout ? (showDocumentation ? topPaneHeight : '100%') : '100%',
					flexShrink: 0
				}}>
					<div className="text-sm font-semibold flex justify-center py-1"
						style={{ color: highContrast }}>
						{'Your Strategy Code\r'}
					</div>
					<div style={{ height: 'calc(100% - 28px)' }}>
						<Editor
							defaultLanguage="typescript"
							value={value ?? defaultValue}
							height="100%"
							onChange={handleEditorChange}
							onMount={handleEditorDidMount}
							beforeMount={handleEditorWillMount}
							onValidate={handleEditorValidation}
							options={{
								minimap: { enabled: showMinimap },
								scrollBeyondLastLine: true
							}}
							theme={theme}
						/>
					</div>
				</div>

				{showDocumentation && (
					<div
						className="relative select-none flex-shrink-0 z-10"
						onMouseDown={handleMouseDown}
						style={{
							cursor: isVerticalLayout ? 'ns-resize' : 'ew-resize',
							height: isVerticalLayout ? '12px' : '100%',
							width: isVerticalLayout ? '100%' : '12px',
							margin: isVerticalLayout ? '-6px 0' : '0 -6px'
						}}
					>
						<div
							className="absolute rounded-full opacity-50"
							style={{
								background: highContrast,
								...(isVerticalLayout
									? { width: '100%', height: '2px', top: '5px' }
									: { width: '2px', height: '100%', left: '5px' })
							}}
						/>
					</div>
				)}

				{showDocumentation && (
					<div style={{
						width: isVerticalLayout ? '100%' : `calc(100% - ${leftPaneWidth})`,
						height: isVerticalLayout ? `calc(100% - ${topPaneHeight})` : '100%',
						flexShrink: 0
					}}>
						<div className="h-full">
							<div className="text-sm font-semibold flex justify-between px-4 py-1"
								style={{ color: highContrast }}>
								<div className="w-4" /> {/* Spacer to help center the text */}
								<span className="flex-grow text-center">{'API Documentation\r'}</span>
								{!isSmallScreen && (
									<button
										type="button"
										onClick={() => { setPreferVerticalLayout(prev => !prev) }}
										title="Toggle layout (side or below) for docs"
										className="w-4" // Match width of left spacer
									>
										{preferVerticalLayout
											? (
												<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
													<rect x="2" y="2" width="20" height="20" strokeWidth="2" />
													<line x1="12" y1="4" x2="12" y2="20" strokeWidth="2" />
												</svg>
											)
											: (
												<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
													<rect x="2" y="2" width="20" height="20" strokeWidth="2" />
													<line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" />
												</svg>
											)}
									</button>
								)}
							</div>
							<div style={{ height: 'calc(100% - 28px)' }}>
								<Editor
									defaultLanguage="typescript"
									value={apiTypes}
									height="calc(100%)"
									options={{
										readOnly: true,
										minimap: { enabled: false },
										scrollBeyondLastLine: true,
										lineNumbers: 'off',
										folding: true,
										wordWrap: 'on',
										domReadOnly: true,
										renderValidationDecorations: 'off',
										renderLineHighlight: 'none',
										hideCursorInOverviewRuler: true,
										links: true,
										overviewRulerBorder: true,
										scrollbar: {
											vertical: 'auto',
											horizontal: 'hidden'
										},
										cursorStyle: 'line-thin',
										contextmenu: false,
										fontSize: 14
									}}
									theme={theme}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default MonacoEditor
