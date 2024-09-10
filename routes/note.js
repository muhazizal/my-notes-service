const express = require('express')

const { getNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controllers/note')
const { createNoteSchema } = require('../schema/note')

const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// Get list notes
router.get('/', authMiddleware, getNotes)

// Create note
router.post('/', [authMiddleware, createNoteSchema], createNote)

// Get note
router.get('/:id', authMiddleware, getNoteById)

// Update note
router.put('/:id', [authMiddleware, createNoteSchema], updateNote)

// Delete note
router.delete('/:id', authMiddleware, deleteNote)

module.exports = router
