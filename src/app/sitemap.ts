import { SubmissionType, TournamentType, UserType } from '@/types/backendDataTypes'
import axios from 'axios'
import { type MetadataRoute } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	try {
		const [users, tournaments, strategies] = await Promise.all([
			axios.get<UserType[]>(`${API_URL}/v1/users`),
			axios.get<TournamentType[]>(`${API_URL}/v1/tournaments`),
			axios.get<SubmissionType[]>(`${API_URL}/v1/submissions`)
		])

		const userUrls = users.data.map(user => ({
			url: `https://www.gaslight.fun/users/${user._id}`,
			lastModified: new Date(user.updatedAt)
		}))

		const userStrategyUrls = users.data.map(user => ({
			url: `https://www.gaslight.fun/users/${user._id}/strategies`,
			lastModified: new Date(user.updatedAt)
		}))

		const tournamentUrls = tournaments.data.map(tournament => ({
			url: `https://www.gaslight.fun/tournaments/${tournament._id}`,
			lastModified: new Date(tournament.updatedAt)
		}))

		const strategyUrls = strategies.data.map(strategy => ({
			url: `https://www.gaslight.fun/strategies/${strategy._id}`,
			lastModified: new Date(strategy.updatedAt)
		}))

		const staticUrls = [
			{
				url: 'https://www.gaslight.fun',
				lastModified: new Date()
			},
			{
				url: 'https://www.gaslight.fun/login',
				lastModified: new Date()
			},
			{
				url: 'https://www.gaslight.fun/signup',
				lastModified: new Date()
			},
			{
				url: 'https://www.gaslight.fun/strategies/new',
				lastModified: new Date()
			},
			{
				url: 'https://www.gaslight.fun/tournaments',
				lastModified: new Date()
			},
			{
				url: 'https://www.gaslight.fun/users',
				lastModified: new Date()
			}
		]

		return [...staticUrls, ...userUrls, ...tournamentUrls, ...strategyUrls, ...userStrategyUrls]
	} catch (error) {
		console.error('Error generating sitemap:', error)
		return [
			{
				url: 'https://www.gaslight.fun',
				lastModified: new Date()
			}
		]
	}
}
