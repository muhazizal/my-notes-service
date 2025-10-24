const { Note: NoteModel, User: UserModel } = require('../models/index')

const { validateRequest, validateNoteExist } = require('../validator/note')

const { sanitizeTiptapHTML } = require('../utils/sanitize-html')
const cache = require('../utils/cache')
const consola = require('consola')

exports.getNotes = async (req, res) => {
	try {
		const { userId } = req

		const cacheKey = `notes:user:${userId}`
		const cached = await cache.getJSON(cacheKey)

		if (cached) {
			return res.status(200).json({
				message: 'Success get notes (cache)',
				data: cached,
				code: 200,
			})
		}

		const result = await NoteModel.sequelize.transaction(async (t) => {
			return await NoteModel.findAll({
				where: {
					userId,
				},
				attributes: ['id', 'title', 'description', 'raw_description', 'createdAt', 'updatedAt'],
				order: [['updatedAt', 'DESC']],
				transaction: t,
			})
		})

		await cache.setJSON(cacheKey, result, 60)

		res.status(200).json({
			message: 'Success get notes',
			data: result,
			code: 200,
		})
	} catch (error) {
		consola.error({
			event: 'note_get_notes_error',
			path: req.originalUrl,
			method: req.method,
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
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

			const created = await NoteModel.create(
				{ title, raw_description: description, description: safe_description, userId },
				{
					attributes: ['id', 'title', 'description', 'raw_description', 'createdAt', 'updatedAt'],
					transaction: t,
				}
			)

			return created
		})

		await cache.del(`notes:user:${req.userId}`)

		res.status(201).json({
			message: 'Success create note',
			data: result,
			code: 201,
		})
	} catch (error) {
		consola.error({
			event: 'note_create_error',
			path: req.originalUrl,
			method: req.method,
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
		})
	}
}

exports.getNoteById = async (req, res) => {
	try {
		const { id } = req.params
		const { userId } = req

		const cacheKey = `note:user:${userId}:${id}`
		const cached = await cache.getJSON(cacheKey)

		if (cached) {
			return res.status(200).json({
				message: 'Success get note (cache)',
				data: cached,
				code: 200,
			})
		}

		const result = await NoteModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const note = await NoteModel.findOne({
				where: {
					id,
					userId,
				},
				attributes: ['id', 'title', 'description', 'raw_description', 'createdAt', 'updatedAt'],
				transaction: t,
			})

			validateNoteExist(note)

			return note
		})

		await cache.setJSON(cacheKey, result, 60)

		res.status(200).json({
			message: 'Success get note',
			data: result,
			code: 200,
		})
	} catch (error) {
		consola.error({
			event: 'note_get_by_id_error',
			path: req.originalUrl,
			method: req.method,
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
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
				attributes: ['id', 'title', 'description', 'raw_description', 'createdAt', 'updatedAt'],
				transaction: t,
			})

			validateNoteExist(note)

			const safe_description = sanitizeTiptapHTML(description)
			note.title = title
			note.raw_description = description
			note.description = safe_description

			return await note.save({ transaction: t })
		})

		await cache.delMany([`notes:user:${req.userId}`, `note:user:${req.userId}:${req.params.id}`])

		res.status(201).json({
			message: 'Success update note',
			data: result,
			code: 201,
		})
	} catch (error) {
		consola.error({
			event: 'note_update_error',
			path: req.originalUrl,
			method: req.method,
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
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

		await cache.delMany([`notes:user:${req.userId}`, `note:user:${req.userId}:${req.params.id}`])

		res.status(200).json({
			message: 'Success delete note',
			code: 200,
		})
	} catch (error) {
		consola.error({
			event: 'note_delete_error',
			path: req.originalUrl,
			method: req.method,
			statusCode: error.statusCode || 500,
			error: error.message,
			validation: error.data,
		})
		res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Internal Server Error',
			data: error.data || {},
		})
	}
}
