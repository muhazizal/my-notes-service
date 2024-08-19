const express = require('express')
const { body } = require('express-validator')

const { getNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controllers/note')

const router = express.Router()

// GET list notes
router.get('/', getNotes)

// CREATE note
router.post(
	'/',
	[
		body('title').trim().notEmpty().withMessage('Title is empty'),
		body('description').trim().notEmpty().withMessage('Description is empty'),
	],
	createNote
)

// GET note
router.get('/:id', getNoteById)

// UPDATE note
router.put(
	'/:id',
	[
		body('title').trim().notEmpty().withMessage('Title is empty'),
		body('description').trim().notEmpty().withMessage('Description is empty'),
	],
	updateNote
)

// DELETE note
router.delete('/:id', deleteNote)

module.exports = router
