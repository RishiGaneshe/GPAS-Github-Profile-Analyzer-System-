const { pool } = require('../config/database')

const upsertProfile = async (profile) => {
    const sql = `
        INSERT INTO profiles (
            github_id, username, name, avatar_url, bio, location, blog,
            company, email, twitter_username, public_repos, public_gists,
            followers, following, account_created_at, account_age_days,
            activity_score, profile_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            username            = VALUES(username),
            name                = VALUES(name),
            avatar_url          = VALUES(avatar_url),
            bio                 = VALUES(bio),
            location            = VALUES(location),
            blog                = VALUES(blog),
            company             = VALUES(company),
            email               = VALUES(email),
            twitter_username    = VALUES(twitter_username),
            public_repos        = VALUES(public_repos),
            public_gists        = VALUES(public_gists),
            followers           = VALUES(followers),
            following           = VALUES(following),
            account_created_at  = VALUES(account_created_at),
            account_age_days    = VALUES(account_age_days),
            activity_score      = VALUES(activity_score),
            profile_url         = VALUES(profile_url),
            updated_at          = CURRENT_TIMESTAMP
    `

    const params = [
        profile.github_id,
        profile.username,
        profile.name,
        profile.avatar_url,
        profile.bio,
        profile.location,
        profile.blog,
        profile.company,
        profile.email,
        profile.twitter_username,
        profile.public_repos,
        profile.public_gists,
        profile.followers,
        profile.following,
        profile.account_created_at,
        profile.account_age_days,
        profile.activity_score,
        profile.profile_url,
    ]

    const [result] = await pool.execute(sql, params)

    if (result.insertId === 0) {
        const [rows] = await pool.execute(
            'SELECT id FROM profiles WHERE github_id = ?',
            [profile.github_id]
        )
        return rows[0].id
    }

    return result.insertId
}

const getProfileByUsername = async (username) => {
    const [rows] = await pool.execute(
        'SELECT * FROM profiles WHERE username = ?',
        [username]
    )
    return rows[0] || null
}

const getAllProfiles = async () => {
    const [rows] = await pool.execute(`
        SELECT
            id, username, name, avatar_url, public_repos, public_gists,
            followers, following, activity_score, account_age_days,
            location, company, profile_url, analyzed_at, updated_at
        FROM profiles
        ORDER BY analyzed_at DESC
    `)
    return rows
}

const deleteProfileByUsername = async (username) => {
    const [result] = await pool.execute(
        'DELETE FROM profiles WHERE username = ?',
        [username]
    )
    return result.affectedRows > 0
}

const replaceTopRepos = async (profileId, repos) => {
    await pool.execute('DELETE FROM repositories WHERE profile_id = ?', [profileId])

    if (!repos || repos.length === 0) return

    const sql = `
        INSERT INTO repositories
            (profile_id, repo_name, description, stars, forks, primary_language, repo_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

    for (const repo of repos) {
        await pool.execute(sql, [
            profileId,
            repo.repo_name,
            repo.description,
            repo.stars,
            repo.forks,
            repo.primary_language,
            repo.repo_url,
            repo.created_at,
        ])
    }
}

const getReposByProfileId = async (profileId) => {
    const [rows] = await pool.execute(
        'SELECT * FROM repositories WHERE profile_id = ? ORDER BY stars DESC',
        [profileId]
    )
    return rows
}

const replaceLanguages = async (profileId, languages) => {
    await pool.execute('DELETE FROM languages WHERE profile_id = ?', [profileId])

    if (!languages || languages.length === 0) return

    const sql = `
        INSERT INTO languages (profile_id, language, bytes, percentage)
        VALUES (?, ?, ?, ?)
    `

    for (const lang of languages) {
        await pool.execute(sql, [
            profileId,
            lang.language,
            lang.bytes,
            lang.percentage,
        ])
    }
}

const getLanguagesByProfileId = async (profileId) => {
    const [rows] = await pool.execute(
        'SELECT * FROM languages WHERE profile_id = ? ORDER BY percentage DESC',
        [profileId]
    )
    return rows
}

module.exports = {
    upsertProfile,
    getProfileByUsername,
    getAllProfiles,
    deleteProfileByUsername,
    replaceTopRepos,
    getReposByProfileId,
    replaceLanguages,
    getLanguagesByProfileId,
}
