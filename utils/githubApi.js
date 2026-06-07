const axios = require('axios')
require('dotenv').config()

const githubClient = axios.create({
    baseURL: 'https://api.github.com',
    timeout: 10000,
    headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(process.env.GITHUB_TOKEN && {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
    },
})

const fetchUserProfile = async (username) => {
    const { data } = await githubClient.get(`/users/${username}`)
    return data
}

const fetchUserRepos = async (username) => {
    const repos = []
    let page = 1
    const perPage = 100

    while (true) {
        const { data } = await githubClient.get(`/users/${username}/repos`, {
            params: { per_page: perPage, page, sort: 'updated', type: 'owner' },
        })

        repos.push(...data)

        if (data.length < perPage) break
        page++
    }

    return repos
}

const fetchRepoLanguages = async (owner, repo) => {
    try {
        const { data } = await githubClient.get(`/repos/${owner}/${repo}/languages`)
        return data
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return {}
        }
        throw error
    }
}

const fetchAggregatedLanguages = async (owner, repos, batchSize = 5) => {
    const aggregated = {}

    for (let i = 0; i < repos.length; i += batchSize) {
        const batch = repos.slice(i, i + batchSize)
        const results = await Promise.all(
            batch.map((repo) => fetchRepoLanguages(owner, repo.name))
        )

        for (const langMap of results) {
            for (const [language, bytes] of Object.entries(langMap)) {
                aggregated[language] = (aggregated[language] || 0) + bytes
            }
        }
    }

    return aggregated
}

const fetchRepoDetails = async (owner, repo) => {
    const { data } = await githubClient.get(`/repos/${owner}/${repo}`)
    return data
}

const fetchRepoContributors = async (owner, repo, limit = 10) => {
    try {
        const { data } = await githubClient.get(`/repos/${owner}/${repo}/contributors`, {
            params: { per_page: limit },
        })
        return data
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return []
        }
        return []
    }
}

const fetchUserFollowers = async (username) => {
    try {
        const { data } = await githubClient.get(`/users/${username}/followers`, { params: { per_page: 100 } })
        return data
    } catch (error) {
        if (error.response && error.response.status === 404) return []
        throw error
    }
}

const fetchUserFollowing = async (username) => {
    try {
        const { data } = await githubClient.get(`/users/${username}/following`, { params: { per_page: 100 } })
        return data
    } catch (error) {
        if (error.response && error.response.status === 404) return []
        throw error
    }
}

const fetchUserGists = async (username) => {
    try {
        const { data } = await githubClient.get(`/users/${username}/gists`, { params: { per_page: 100 } })
        return data
    } catch (error) {
        if (error.response && error.response.status === 404) return []
        throw error
    }
}

const handleGitHubError = (error) => {
    if (error.response) {
        const { status, data } = error.response

        if (status === 404) {
            const err = new Error('GitHub user not found.')
            err.statusCode = 404
            return err
        }

        if (status === 403 && data?.message?.includes('rate limit')) {
            const err = new Error(
                'GitHub API rate limit exceeded. Please try again later or set a GITHUB_TOKEN in .env.'
            )
            err.statusCode = 429
            return err
        }

        const err = new Error(data?.message || 'GitHub API error.')
        err.statusCode = status
        return err
    }

    if (error.code === 'ECONNABORTED') {
        const err = new Error('GitHub API request timed out.')
        err.statusCode = 504
        return err
    }

    return error
}

module.exports = {
    githubClient,
    fetchUserProfile,
    fetchUserRepos,
    fetchRepoLanguages,
    fetchAggregatedLanguages,
    fetchRepoDetails,
    fetchRepoContributors,
    fetchUserFollowers,
    fetchUserFollowing,
    fetchUserGists,
    handleGitHubError,
}
