import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	{
		rules: {
			'react-hooks/set-state-in-effect': 'off',
			// False positive: flags useCallbacks that read refs async (e.g. inside
			// .then()) when passed to onClick, even though the ref is only accessed
			// at call time, not during render.
			'react-hooks/refs': 'off',
		},
	},
	globalIgnores([
		'.next/**',
		'out/**',
		'build/**',
		'next-env.d.ts',
	]),
])

export default eslintConfig
