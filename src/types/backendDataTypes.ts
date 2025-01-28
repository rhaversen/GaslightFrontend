export interface UserType {
	/** ID of the user */
	_id: string
	/** Username of the user */
	username: string
	/** Email of the user */
	email: string | null
	/** If the user has confirmed their email */
	confirmed: boolean | null
	/** Date when the user will be deleted if not confirmed */
	expirationDate?: Date | null
	/** Amount of user submissions */
	submissionCount: number
	/** Active submission name */
	activeSubmission: string | null

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

export interface GradingType {
	/** ID of the grading */
	_id: string
	/** Submission being graded */
	submission: ISubmission['_id']
	/** Score given to the submission */
	score: number

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

export interface TournamentWinner {
	user: UserType['_id']
	submission: GradingType['_id']
	grade: number
	zValue: number
}

export interface TournamentStatistics {
	percentiles: {
		p25: number
		p50: number
		p75: number
		p90: number
	}
	averageScore: number
	medianScore: number
}

export interface TournamentType {
	/** ID of the tournament */
	_id: string
	/** All gradings created from this tournament */
	gradings: GradingType['_id']
	/** All disqualifications from this tournament */
	disqualified?: [{
		submission: GradingType['_id']
		reason: string
	}]
	/** Tournament winners */
	winners: {
		first: TournamentWinner
		second?: TournamentWinner
		third?: TournamentWinner
	}
	/** Tournament statistics */
	statistics: TournamentStatistics

	// Timestamps
	createdAt: Date
	updatedAt: Date
}