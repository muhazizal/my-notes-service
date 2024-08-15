const express = require('express')
const { getNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controllers/note')

const router = express.Router()

router.get('/notes', getNotes)
router.post('/notes', createNote)
router.get('/notes/:id', getNoteById)
router.put('/notes/:id', updateNote)
router.delete('/notes/:id', deleteNote)

module.exports = router
