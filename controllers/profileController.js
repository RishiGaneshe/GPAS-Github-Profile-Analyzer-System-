const {
    analyzeProfile,
    getStoredProfile,
    listAllProfiles,
    removeProfile,
    compareProfiles,
    getRepoDetails,
} = require('../services/profileService')

const analyze = async (req, res, next) => {
    try {
        const { username } = req.params

        if (!username || username.trim() === '') {
            return res.status(400).json({
                success: false,
                error: { message: 'Username parameter is required.', statusCode: 400 },
            })
        }

        console.log(`Analyzing GitHub profile: ${username}`)
        const result = await analyzeProfile(username.trim())

        res.status(200).json({
            success: true,
            message: `Profile "${username}" analyzed and stored successfully.`,
            data: result,
        })
    } catch (error) {
        next(error)
    }
}

const getAll = async (req, res, next) => {
    try {
        const profiles = await listAllProfiles()

        res.status(200).json({
            success: true,
            count: profiles.length,
            data: profiles,
        })
    } catch (error) {
        next(error)
    }
}

const compare = async (req, res, next) => {
    try {
        const { users } = req.query

        if (!users) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Query parameter "users" is required. Example: ?users=user1,user2',
                    statusCode: 400,
                },
            })
        }

        const userList = users.split(',').map((u) => u.trim()).filter(Boolean)

        if (userList.length !== 2) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Exactly two usernames are required, separated by a comma.',
                    statusCode: 400,
                },
            })
        }

        console.log(`Comparing profiles: ${userList[0]} vs ${userList[1]}`)
        const result = await compareProfiles(userList[0], userList[1])

        res.status(200).json({
            success: true,
            data: result,
        })
    } catch (error) {
        next(error)
    }
}

const getOne = async (req, res, next) => {
    try {
        const { username } = req.params
        const result = await getStoredProfile(username)

        if (!result) {
            return res.status(404).json({
                success: false,
                error: {
                    message: `No stored profile found for "${username}". Analyze it first via POST /api/profiles/${username}`,
                    statusCode: 404,
                },
            })
        }

        res.status(200).json({
            success: true,
            data: result,
        })
    } catch (error) {
        next(error)
    }
}

const remove = async (req, res, next) => {
    try {
        const { username } = req.params
        const deleted = await removeProfile(username)

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: {
                    message: `No stored profile found for "${username}".`,
                    statusCode: 404,
                },
            })
        }

        res.status(200).json({
            success: true,
            message: `Profile "${username}" and all related data deleted successfully.`,
        })
    } catch (error) {
        next(error)
    }
}

const getRepo = async (req, res, next) => {
    try {
        const { username, repo } = req.params
        
        console.log(`Fetching repo details: ${username}/${repo}`)
        const result = await getRepoDetails(username, repo)
        
        res.status(200).json({
            success: true,
            data: result,
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    analyze,
    getAll,
    getOne,
    compare,
    remove,
    getRepo,
    getAllRepos: async (req, res, next) => {
        try {
            const { username } = req.params
            const { getAllRepos } = require('../services/profileService')
            res.status(200).json({ success: true, data: await getAllRepos(username) })
        } catch (err) { next(err) }
    },
    getFollowers: async (req, res, next) => {
        try {
            const { username } = req.params
            const { getFollowers } = require('../services/profileService')
            res.status(200).json({ success: true, data: await getFollowers(username) })
        } catch (err) { next(err) }
    },
    getFollowing: async (req, res, next) => {
        try {
            const { username } = req.params
            const { getFollowing } = require('../services/profileService')
            res.status(200).json({ success: true, data: await getFollowing(username) })
        } catch (err) { next(err) }
    },
    getGists: async (req, res, next) => {
        try {
            const { username } = req.params
            const { getGists } = require('../services/profileService')
            res.status(200).json({ success: true, data: await getGists(username) })
        } catch (err) { next(err) }
    },
}
