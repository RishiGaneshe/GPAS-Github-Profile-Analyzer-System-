const express = require('express')
const router = express.Router()
const {
    analyze,
    getAll,
    getOne,
    compare,
    remove,
    getRepo,
    getAllRepos,
    getFollowers,
    getFollowing,
    getGists,
} = require('../controllers/profileController')

router.get('/compare', compare)
router.get('/', getAll)
router.get('/:username', getOne)
router.get('/:username/all-repos', getAllRepos)
router.get('/:username/followers', getFollowers)
router.get('/:username/following', getFollowing)
router.get('/:username/gists', getGists)
router.get('/:username/repos/:repo', getRepo)
router.post('/:username', analyze)
router.delete('/:username', remove)

module.exports = router
