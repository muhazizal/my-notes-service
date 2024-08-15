const Note = require('../models/note')
const model = Note()

const { validateReqBody, validateReqParams, validateNoteExist } = require('../utils/note')

exports.getNotes = async (req, res, next) => {
	try {
		const result = await model.sequelize.transaction(async (t) => {
			return await model.findAll({
				transaction: t,
			})
		})

		res.status(200).json({
			message: 'Success get notes',
			data: result,
			code: 200,
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.createNote = async (req, res, next) => {
	try {
		const result = await model.sequelize.transaction(async (t) => {
			validateReqBody(req.body)

			const { title, description } = req.body

			return await model.create(
				{
					title,
					description,
				},
				{ transaction: t }
			)
		})

		res.status(201).json({
			message: 'Success create note',
			data: result,
			code: 201,
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.getNoteById = async (req, res, next) => {
	try {
		const result = await model.sequelize.transaction(async (t) => {
			validateReqParams(req.params)

			const { id } = req.params

			const note = await model.findByPk(id, { transaction: t })

			validateNoteExist(note)

			return note
		})

		res.status(200).json({
			message: 'Success get note',
			data: result,
			code: 200,
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.updateNote = async (req, res, next) => {
	try {
		const result = await model.sequelize.transaction(async (t) => {
			validateReqParams(req.params)
			validateReqBody(req.body)

			const { id } = req.params
			const { title, description } = req.body

			const note = await model.findByPk(id, { transaction: t })

			validateNoteExist(note)

			note.title = title
			note.description = description

			return note.save({ transaction: t })
		})

		res.status(201).json({
			message: 'Success update note',
			data: result,
			code: 201,
		})
	} catch (error) {
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.deleteNote = async (req, res, next) => {
	try {
		await model.sequelize.transaction(async (t) => {
			validateReqParams(req.params)

			const { id } = req.params

			const note = await model.findByPk(id, { transaction: t })

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
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}
