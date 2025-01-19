import React, { useState } from 'react'
import Editor, { type Monaco } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { shikiToMonaco } from '@shikijs/monaco'
import { createHighlighter } from 'shiki'

const apiTypes = `interface MeyerStrategyAPI {
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

const defaultCode = `const main = (api: MeyerStrategyAPI) => {
	// If we're first in the round, we need to roll
	if (api.isFirstInRound()) {
		api.roll()
		return
	}

	// Randomly reveal
	if (Math.random() > 0.5) {
		api.reveal()
		return
	}

	// Get previous announced value
	const lastScore = api.getPreviousAction()

	// Roll the dice
	const currentScore = api.roll()

	// If our score is higher or equal, finish the turn
	if (lastScore === null || currentScore >= lastScore) {
		return
	}

	// If our score is lower, we can either lie or call "det eller derover"
	if (Math.random() > 0.5) {
		api.lie(lastScore)
	} else {
		api.detEllerDerover()
	}
}

export default main
`

// Commented out themes are found to be not working with Shiki 1.27.2
// https://shiki.style/themes#bundled-themes
const MONACO_THEMES = [
	{ label: 'Andromeeda', value: 'andromeeda' },
	{ label: 'Aurora X', value: 'aurora-x' },
	{ label: 'Ayu Dark', value: 'ayu-dark' },
	{ label: 'Catppuccin Frappé', value: 'catppuccin-frappe' },
	{ label: 'Catppuccin Latte', value: 'catppuccin-latte' },
	{ label: 'Catppuccin Macchiato', value: 'catppuccin-macchiato' },
	{ label: 'Catppuccin Mocha', value: 'catppuccin-mocha' },
	{ label: 'Dark Plus', value: 'dark-plus' },
	{ label: 'Dracula Theme', value: 'dracula' },
	{ label: 'Dracula Theme Soft', value: 'dracula-soft' },
	{ label: 'Everforest Dark', value: 'everforest-dark' },
	{ label: 'Everforest Light', value: 'everforest-light' },
	{ label: 'GitHub Dark', value: 'github-dark' },
	// { label: 'GitHub Dark Default', value: 'github-dark-default' },
	// { label: 'GitHub Dark Dimmed', value: 'github-dark-dimmed' },
	// { label: 'GitHub Dark High Contrast', value: 'github-dark-high-contrast' },
	{ label: 'GitHub Light', value: 'github-light' },
	{ label: 'GitHub Light Default', value: 'github-light-default' },
	{ label: 'GitHub Light High Contrast', value: 'github-light-high-contrast' },
	{ label: 'Houston', value: 'houston' },
	{ label: 'Kanagawa Dragon', value: 'kanagawa-dragon' },
	{ label: 'Kanagawa Lotus', value: 'kanagawa-lotus' },
	{ label: 'Kanagawa Wave', value: 'kanagawa-wave' },
	{ label: 'LaserWave', value: 'laserwave' },
	{ label: 'Light Plus', value: 'light-plus' },
	{ label: 'Material Theme', value: 'material-theme' },
	{ label: 'Material Theme Darker', value: 'material-theme-darker' },
	{ label: 'Material Theme Lighter', value: 'material-theme-lighter' },
	{ label: 'Material Theme Ocean', value: 'material-theme-ocean' },
	{ label: 'Material Theme Palenight', value: 'material-theme-palenight' },
	{ label: 'Min Dark', value: 'min-dark' },
	{ label: 'Min Light', value: 'min-light' },
	{ label: 'Monokai', value: 'monokai' },
	{ label: 'Night Owl', value: 'night-owl' },
	{ label: 'Nord', value: 'nord' },
	{ label: 'One Dark Pro', value: 'one-dark-pro' },
	{ label: 'One Light', value: 'one-light' },
	{ label: 'Plastic', value: 'plastic' },
	{ label: 'Poimandres', value: 'poimandres' },
	{ label: 'Red', value: 'red' },
	{ label: 'Rosé Pine', value: 'rose-pine' },
	{ label: 'Rosé Pine Dawn', value: 'rose-pine-dawn' },
	{ label: 'Rosé Pine Moon', value: 'rose-pine-moon' },
	{ label: 'Slack Dark', value: 'slack-dark' },
	{ label: 'Slack Ochin', value: 'slack-ochin' },
	{ label: 'Snazzy Light', value: 'snazzy-light' },
	{ label: 'Solarized Dark', value: 'solarized-dark' },
	{ label: 'Solarized Light', value: 'solarized-light' },
	{ label: 'Synthwave \'84', value: 'synthwave-84' },
	{ label: 'Tokyo Night', value: 'tokyo-night' },
	// { label: 'Vesper', value: 'vesper' },
	{ label: 'Vitesse Black', value: 'vitesse-black' },
	{ label: 'Vitesse Dark', value: 'vitesse-dark' },
	{ label: 'Vitesse Light', value: 'vitesse-light' }
] as const

async function initializeShiki (monaco: Monaco): Promise<void> {
	const highlighter = await createHighlighter({
		themes: MONACO_THEMES.map(theme => theme.value),
		langs: ['typescript']
	})

	// Register the languages
	monaco.languages.register({ id: 'typescript' })

	// Register Shiki themes
	// shikiToMonaco has weak types, so we need to cast the highlighter to any
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	shikiToMonaco(highlighter, monaco)
}

const MonacoEditor = ({
	defaultValue = defaultCode,
	height = '90vh',
	onChange
}: {
	defaultValue?: string
	height?: string
	onChange?: (value: string | undefined, event: any) => void
}): JSX.Element => {
	const [theme, setTheme] = useState<typeof MONACO_THEMES[number]['value']>()

	function handleEditorChange (value: string | undefined, event: monaco.editor.IModelContentChangedEvent): void {
		if (onChange !== null && onChange !== undefined) {
			onChange(value, event)
		}
	}

	function handleEditorWillMount (monaco: Monaco): void {
		// Having two instances of Monaco in the same page will automatically share the same worker, so we don't need to worry about adding extra libs
		// If we want to add extra libs, we can do so like this:
		// monaco.languages.typescript.typescriptDefaults.addExtraLib(apiTypes, 'ts:filename/MeyerStrategyAPI.d.ts')
		initializeShiki(monaco).catch(console.error)
	}

	function handleEditorDidMount (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco): void {
		console.log('onMount: the editor instance:', editor)
		console.log('onMount: the monaco instance:', monaco)
	}

	function handleEditorValidation (markers: monaco.editor.IMarker[]): void {
		// model markers
		// markers.forEach(marker => console.log('onValidate:', marker.message));
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end px-4">
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
			</div>
			<div className="flex gap-4">
				<div className="flex-1 flex-shrink flex-grow-[1] w-[60%]">
					<Editor
						defaultLanguage="typescript"
						defaultValue={defaultValue}
						height={height}
						onChange={handleEditorChange}
						onMount={handleEditorDidMount}
						beforeMount={handleEditorWillMount}
						onValidate={handleEditorValidation}
						options={{
							minimap: { enabled: true },
							scrollBeyondLastLine: true
						}}
						theme={theme}
					/>
				</div>
				<div className="flex-1 flex-shrink flex-grow-[1] w-[40%]">
					<Editor
						defaultLanguage="typescript"
						value={apiTypes}
						height={height}
						options={{
							readOnly: true,
							minimap: { enabled: true },
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
	)
}

export default MonacoEditor
