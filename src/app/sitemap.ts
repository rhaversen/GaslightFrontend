import { type MetadataRoute } from 'next'

import { submissionsApi, tournamentsApi, usersApi } from '@/api'

export default async function sitemap (): Promise<MetadataRoute.Sitemap> {
	try {
		const [users, tournaments, strategies] = await Promise.all([
			usersApi.list(),
			tournamentsApi.list(),
			submissionsApi.list()
		])

		const userUrls = users.map(user => ({
			url: `https://www.gaslight.fun/explore?focus=user/${user._id}`,
			lastModified: new Date(user.updatedAt)
		}))

		const userStrategyUrls = users.map(user => ({
			url: `https://www.gaslight.fun/explore?focus=user/${user._id}`,
			lastModified: new Date(user.updatedAt)
		}))

		const tournamentUrls = tournaments.map(tournament => ({
			url: `https://www.gaslight.fun/tournaments/${tournament._id}`,
			lastModified: new Date(tournament.updatedAt)
		}))

		const strategyUrls = strategies.map(strategy => ({
			url: `https://www.gaslight.fun/explore?focus=strategy/${strategy._id}`,
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
				url: 'https://www.gaslight.fun/explore',
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
