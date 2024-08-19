const express = require('express')
const { getNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controllers/note')

const router = express.Router()

router.get('/', getNotes)
router.post('/', createNote)
router.get('/:id', getNoteById)
router.put('/:id', updateNote)
router.delete('/:id', deleteNote)

module.exports = router
