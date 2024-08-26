const express = require('express')

const { getNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controllers/note')
const { createNoteSchema } = require('../schema/note')

const router = express.Router()

// GET list notes
router.get('/', getNotes)

// CREATE note
router.post('/', createNoteSchema, createNote)

// GET note
router.get('/:id', getNoteById)

// UPDATE note
router.put('/:id', createNoteSchema, updateNote)

// DELETE note
router.delete('/:id', deleteNote)

module.exports = router
