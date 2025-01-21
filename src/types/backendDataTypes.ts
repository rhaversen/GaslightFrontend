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
	/** Code submitted by the user. Null if not requested by owner */
	code: string | null
	/** User who submitted the code */
	user: UserType['_id']
	/** Decides if the submission is part of the tournament (Can only have one active submission per user) */
	active: boolean
	/** Decides if the submission has passed an evaluation and is ready for tournaments. Null if not evaluated yet */
	passedEvaluation: boolean | null
	/** The lines of code in the submission */
	tokenCount: number
	/** Evaluation of the submission */
	evaluation: {
		// Properties
		results: {
			/** This submission's score */
			candidate: number
			/** Average score of all submissions */
			average: number
		} | undefined
		/** Reason for disqualification */
		disqualified: string | null
		/** If the execution time exceeded the limit */
		executionTimeExceeded: boolean
		/** If the loading time exceeded the limit */
		loadingTimeExceeded: boolean
		/** Time taken to load the strategy */
		strategyLoadingTimings: number | undefined
		/** Time taken to execute the strategy */
		strategyExecutionTimings: number[] | undefined
		/** Averate time taken to execute the strategy */
		averageExecutionTime: number | undefined

		// Timestamps
		createdAt: Date
		updatedAt: Date
	}

	// Timestamps
	createdAt: Date
	updatedAt: Date
}
