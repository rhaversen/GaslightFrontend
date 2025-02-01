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

interface IGradingStatistics {
	/** Percentile rank (0-100) of this grading's score */
	percentileRank: number
	/** Standard score (z-score) */
	standardScore: number
	/** How many standard deviations from mean */
	deviationsFromMean: number
	/** Relative performance (-1 to 1) compared to mean */
	normalizedScore: number
}

export interface TournamentStanding {
	user: UserType['_id']
	userName: string
	submission: ISubmission['_id']
	submissionName: string
	grade: number
	zValue: number
	tokenCount: number
	placement: number
	statistics: IGradingStatistics
}

export interface TournamentStatistics {
	sampleSize: number
	centralTendency: {
		/** Simple average of all scores */
		arithmeticMean: number
		/** Only calculated for non-zero scores. Useful for averaging rates */
		harmonicMean: number | null
		/** Most frequent score(s) */
		mode: number[]
	}
	dispersion: {
		/** Average squared deviation from the mean */
		variance: number
		/** Square root of variance, indicates spread of scores */
		standardDeviation: number
		/** Difference between 75th and 25th percentiles */
		interquartileRange: number
	}
	distribution: {
		/** Measure of asymmetry. Positive means tail on right, negative means tail on left */
		skewness: number | null
		/** Measure of outliers. Higher values mean more extreme outliers */
		kurtosis: number | null
	}
	percentiles: {
		p10: number
		p25: number
		p50: number
		p75: number
		p90: number
	}
	extrema: {
		minimum: number
		maximum: number
		range: number
	}
	tukeyCriteria: {
		lowerBound: number
		upperBound: number
	}
	outlierValues: number[]
}

export interface TournamentType {
	/** ID of the tournament */
	_id: string
	/** All disqualifications from this tournament */
	disqualified?: [{
		submission: ISubmission['_id']
		reason: string
	}]
	/** Tournament winners */
	standings: TournamentStanding[]
	/** User standing */
	userStanding: TournamentStanding | null

	/** Tournament execution time in milliseconds */
	tournamentExecutionTime: number

	// Timestamps
	createdAt: Date
	updatedAt: Date
}