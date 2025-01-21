export interface UserType {
	/** ID of the user */
	_id: string
	/** Username of the user */
	username: string
	/** Email of the user */
	email: string
	/** Hashed password of the user */
	password: string
	/** If the user has confirmed their email */
	confirmed: boolean
	/** Date when the user will be deleted if not confirmed */
	expirationDate?: Date
	/** Date when the password reset code will expire */
	passwordResetExpirationDate?: Date

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

export interface ISubmission {
	/** ID of the submission */
	_id: string
	/** Title of the submission */
	title: string
	/** Code submitted by the user */
	code: string | null
	/** User who submitted the code */
	user: UserType['_id']
	/** Decides if the submission is part of the tournament (Can only have one active submission per user) */
	active: boolean
	/** Decides if the submission has passed an evaluation and is ready for tournaments */
	passedEvaluation: boolean
	/** The lines of code in the submission */
	loc: number

	// Timestamps
	createdAt: Date
	updatedAt: Date
}
