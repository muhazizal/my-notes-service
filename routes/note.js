const express = require('express')

const { getNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controllers/note')
const { createNoteSchema } = require('../schema/note')

const router = express.Router()

// Get list notes
router.get('/', getNotes)

// Create note
router.post('/', createNoteSchema, createNote)

// Get note
router.get('/:id', getNoteById)

// Update note
router.put('/:id', createNoteSchema, updateNote)

// Delete note
router.delete('/:id', deleteNote)

module.exports = router
