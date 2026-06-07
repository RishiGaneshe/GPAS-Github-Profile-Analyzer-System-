const {
    fetchUserProfile,
    fetchUserRepos,
    fetchAggregatedLanguages,
    handleGitHubError,
} = require('../utils/githubApi')

const {
    upsertProfile,
    getProfileByUsername,
    getAllProfiles,
    deleteProfileByUsername,
    replaceTopRepos,
    getReposByProfileId,
    replaceLanguages,
    getLanguagesByProfileId,
} = require('../models/profileModel')

const calculateAccountAge = (createdAt) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now - created
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

const calculateActivityScore = (profile) => {
    return (
        (profile.public_repos || 0) * 2 +
        (profile.followers || 0) +
        (profile.public_gists || 0) +
        (profile.following || 0) * 0.5
    )
}

const extractTopRepos = (repos, limit = 5) => {
    return repos
        .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
        .slice(0, limit)
        .map((repo) => ({
            repo_name: repo.name,
            description: repo.description || null,
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            primary_language: repo.language || null,
            repo_url: repo.html_url,
            created_at: repo.created_at ? new Date(repo.created_at) : null,
        }))
}

const computeLanguagePercentages = (langMap) => {
    const totalBytes = Object.values(langMap).reduce((sum, b) => sum + b, 0)

    if (totalBytes === 0) return []

    return Object.entries(langMap)
        .map(([language, bytes]) => ({
            language,
            bytes,
            percentage: parseFloat(((bytes / totalBytes) * 100).toFixed(2)),
        }))
        .sort((a, b) => b.percentage - a.percentage)
}

const analyzeProfile = async (username) => {
    let profileData, repos

    try {
        [profileData, repos] = await Promise.all([
            fetchUserProfile(username),
            fetchUserRepos(username),
        ])
    } catch (error) {
        throw handleGitHubError(error)
    }

    let aggregatedLangs = {}
    try {
        aggregatedLangs = await fetchAggregatedLanguages(username, repos)
    } catch (error) {
        console.warn('Language aggregation partially failed:', error.message)
    }

    const accountAgeDays = calculateAccountAge(profileData.created_at)
    const activityScore = calculateActivityScore(profileData)
    const topRepos = extractTopRepos(repos)
    const languages = computeLanguagePercentages(aggregatedLangs)

    const profileRecord = {
        github_id: profileData.id,
        username: profileData.login,
        name: profileData.name,
        avatar_url: profileData.avatar_url,
        bio: profileData.bio,
        location: profileData.location,
        blog: profileData.blog || null,
        company: profileData.company,
        email: profileData.email,
        twitter_username: profileData.twitter_username,
        public_repos: profileData.public_repos,
        public_gists: profileData.public_gists,
        followers: profileData.followers,
        following: profileData.following,
        account_created_at: new Date(profileData.created_at),
        account_age_days: accountAgeDays,
        activity_score: activityScore,
        profile_url: profileData.html_url,
    }

    const profileId = await upsertProfile(profileRecord)
    await Promise.all([
        replaceTopRepos(profileId, topRepos),
        replaceLanguages(profileId, languages),
    ])

    return {
        profile: { id: profileId, ...profileRecord, analyzed_at: new Date() },
        top_repositories: topRepos,
        languages,
    }
}

const getStoredProfile = async (username) => {
    const profile = await getProfileByUsername(username)
    if (!profile) return null

    const [topRepos, languages] = await Promise.all([
        getReposByProfileId(profile.id),
        getLanguagesByProfileId(profile.id),
    ])

    return {
        profile,
        top_repositories: topRepos,
        languages,
    }
}

const listAllProfiles = async () => {
    return getAllProfiles()
}

const removeProfile = async (username) => {
    return deleteProfileByUsername(username)
}

const compareProfiles = async (user1, user2) => {
    const getOrAnalyze = async (username) => {
        const stored = await getStoredProfile(username)
        if (stored) return stored
        return analyzeProfile(username)
    }

    const [data1, data2] = await Promise.all([
        getOrAnalyze(user1),
        getOrAnalyze(user2),
    ])

    const metrics = ['followers', 'following', 'public_repos', 'public_gists', 'activity_score', 'account_age_days']

    const comparison = {}
    let user1Wins = 0
    let user2Wins = 0

    for (const metric of metrics) {
        const val1 = data1.profile[metric] || 0
        const val2 = data2.profile[metric] || 0

        let winner = 'tie'
        if (val1 > val2) { winner = user1; user1Wins++ }
        else if (val2 > val1) { winner = user2; user2Wins++ }

        comparison[metric] = {
            [user1]: val1,
            [user2]: val2,
            winner,
        }
    }

    let overallWinner = 'tie'
    if (user1Wins > user2Wins) overallWinner = user1
    else if (user2Wins > user1Wins) overallWinner = user2

    return {
        users: [user1, user2],
        comparison,
        overall_winner: overallWinner,
        score: { [user1]: user1Wins, [user2]: user2Wins },
    }
}

const getRepoDetails = async (owner, repo) => {
    const {
        fetchRepoDetails,
        fetchRepoLanguages,
        fetchRepoContributors,
        handleGitHubError,
    } = require('../utils/githubApi')

    let repoData, languages, contributors

    try {
        [repoData, languages, contributors] = await Promise.all([
            fetchRepoDetails(owner, repo),
            fetchRepoLanguages(owner, repo),
            fetchRepoContributors(owner, repo, 10),
        ])
    } catch (error) {
        throw handleGitHubError(error)
    }

    const totalBytes = Object.values(languages).reduce((sum, b) => sum + b, 0)
    const languageBreakdown = Object.entries(languages)
        .map(([lang, bytes]) => ({
            language: lang,
            bytes,
            percentage: totalBytes > 0 ? parseFloat(((bytes / totalBytes) * 100).toFixed(2)) : 0,
        }))
        .sort((a, b) => b.percentage - a.percentage)

    const contributorList = (contributors || []).map(c => ({
        username: c.login,
        avatar_url: c.avatar_url,
        contributions: c.contributions,
        profile_url: c.html_url,
    }))

    return {
        name: repoData.name,
        full_name: repoData.full_name,
        description: repoData.description,
        owner: {
            username: repoData.owner.login,
            avatar_url: repoData.owner.avatar_url,
        },
        html_url: repoData.html_url,
        clone_url: repoData.clone_url,
        homepage: repoData.homepage,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.watchers_count,
        open_issues: repoData.open_issues_count,
        primary_language: repoData.language,
        topics: repoData.topics || [],
        license: repoData.license ? repoData.license.name : null,
        is_fork: repoData.fork,
        is_archived: repoData.archived,
        is_template: repoData.is_template,
        default_branch: repoData.default_branch,
        size_kb: repoData.size,
        visibility: repoData.visibility,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
        pushed_at: repoData.pushed_at,
        languages: languageBreakdown,
        contributors: contributorList,
    }
}

const getAllRepos = async (username) => {
    const { fetchUserRepos, handleGitHubError } = require('../utils/githubApi')
    try {
        const repos = await fetchUserRepos(username)
        return repos.map(repo => ({
            name: repo.name,
            description: repo.description,
            html_url: repo.html_url,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            updated_at: repo.updated_at
        })).sort((a, b) => b.stars - a.stars)
    } catch (error) {
        throw handleGitHubError(error)
    }
}

const getFollowers = async (username) => {
    const { fetchUserFollowers, handleGitHubError } = require('../utils/githubApi')
    try {
        const users = await fetchUserFollowers(username)
        return users.map(u => ({ username: u.login, avatar_url: u.avatar_url, html_url: u.html_url }))
    } catch (error) {
        throw handleGitHubError(error)
    }
}

const getFollowing = async (username) => {
    const { fetchUserFollowing, handleGitHubError } = require('../utils/githubApi')
    try {
        const users = await fetchUserFollowing(username)
        return users.map(u => ({ username: u.login, avatar_url: u.avatar_url, html_url: u.html_url }))
    } catch (error) {
        throw handleGitHubError(error)
    }
}

const getGists = async (username) => {
    const { fetchUserGists, handleGitHubError } = require('../utils/githubApi')
    try {
        const gists = await fetchUserGists(username)
        return gists.map(g => ({
            id: g.id,
            description: g.description,
            html_url: g.html_url,
            created_at: g.created_at,
            files: Object.keys(g.files)
        }))
    } catch (error) {
        throw handleGitHubError(error)
    }
}

module.exports = {
    analyzeProfile,
    getStoredProfile,
    listAllProfiles,
    removeProfile,
    compareProfiles,
    getRepoDetails,
    getAllRepos,
    getFollowers,
    getFollowing,
    getGists,
}
