const { Note: NoteModel, User: UserModel } = require('../models/index')

const { validateRequest, validateNoteExist } = require('../validator/note')

const { pickAttributes } = require('../utils/filter')
const { sanitizeTiptapHTML } = require('../utils/sanitize-html')

exports.getNotes = async (req, res) => {
	try {
		const result = await NoteModel.sequelize.transaction(async (t) => {
			const { userId } = req

			return await NoteModel.findAll({
				where: {
					userId,
				},
				attributes: ['id', 'title', 'description', 'updatedAt'],
				transaction: t,
			})
		})

		res.status(200).json({
			message: 'Success get notes',
			data: result,
			code: 200,
		})
	} catch (error) {
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
		})
	}
}

exports.createNote = async (req, res) => {
	try {
		const result = await NoteModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { userId } = req
			const { title, description } = req.body
			const safe_description = sanitizeTiptapHTML(description)

			const newNote = await NoteModel.create(
				{ title, raw_description: description, description: safe_description, userId },
				{ attributes: ['id', 'title', 'description', 'createdAt'], transaction: t }
			)

			return pickAttributes(newNote.dataValues, ['id', 'title', 'description', 'createdAt'])
		})

		res.status(201).json({
			message: 'Success create note',
			data: result,
			code: 201,
		})
	} catch (error) {
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
		})
	}
}

exports.getNoteById = async (req, res) => {
	try {
		const result = await NoteModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { id } = req.params
			const { userId } = req

			const note = await NoteModel.findOne({
				where: {
					id,
					userId,
				},
				attributes: ['id', 'title', 'description', 'createdAt', 'updatedAt'],
				transaction: t,
			})

			validateNoteExist(note)

			return note
		})

		res.status(200).json({
			message: 'Success get note',
			data: result,
			code: 200,
		})
	} catch (error) {
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
		})
	}
}

exports.updateNote = async (req, res) => {
	try {
		const result = await NoteModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { id } = req.params
			const { title, description } = req.body
			const { userId } = req

			const note = await NoteModel.findOne({
				where: {
					id,
					userId,
				},
				attributes: ['id', 'title', 'description', 'updatedAt'],
				transaction: t,
			})

			validateNoteExist(note)

			note.title = title
			note.description = description

			return await note.save({ transaction: t })
		})

		res.status(201).json({
			message: 'Success update note',
			data: result,
			code: 201,
		})
	} catch (error) {
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
		})
	}
}

exports.deleteNote = async (req, res) => {
	try {
		await NoteModel.sequelize.transaction(async (t) => {
			const { id } = req.params
			const { userId } = req

			const note = await NoteModel.findOne({
				where: {
					id,
					userId,
				},
				transaction: t,
			})

			validateNoteExist(note)

			return await note.destroy({
				transaction: t,
			})
		})

		res.status(200).json({
			message: 'Success delete note',
			code: 200,
		})
	} catch (error) {
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
		})
	}
}
