import React, { type ChangeEvent, type ReactElement } from 'react'

interface PasswordInputProps {
	name: string
	value: string
	placeholder?: string
	onChange: (e: ChangeEvent<HTMLInputElement>) => void
	borderColor?: string
	inputType?: 'password' | 'text'
}

export default function PasswordInput ({
	name,
	value,
	placeholder,
	onChange,
	borderColor,
	inputType = 'password'
}: PasswordInputProps): ReactElement<any> {
	return (
		<input
			type={inputType}
			name={name}
			value={value}
			placeholder={placeholder}
			onChange={onChange}
			className={`w-full p-2 pr-10 text-gray-700 border rounded-lg
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
        ${borderColor ?? ''}`}
		/>
	)
}
