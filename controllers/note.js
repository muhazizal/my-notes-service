const { Note: NoteModel, User: UserModel } = require('../models/index')

const { validateRequest, validateNoteExist } = require('../validator/note')
const { validateUserNotExist } = require('../validator/auth')

exports.getNotes = async (req, res, next) => {
	try {
		const result = await NoteModel.sequelize.transaction(async (t) => {
			const { id: userId } = req.user

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
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.createNote = async (req, res, next) => {
	try {
		const result = await UserModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { title, description } = req.body
			const { id: userId } = req.user

			const user = await UserModel.findByPk(userId, { transaction: t })

			validateUserNotExist(user)

			return await user.createNote(
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
		const result = await NoteModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { id } = req.params
			const { id: userId } = req.user

			const note = await NoteModel.findOne({
				where: {
					id,
					userId,
				},
				attributes: ['id', 'title', 'description', 'updatedAt'],
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
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.updateNote = async (req, res, next) => {
	try {
		const result = await NoteModel.sequelize.transaction(async (t) => {
			validateRequest(req, res)

			const { id } = req.params
			const { title, description } = req.body
			const { id: userId } = req.user

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
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}

exports.deleteNote = async (req, res, next) => {
	try {
		await NoteModel.sequelize.transaction(async (t) => {
			const { id } = req.params
			const { id: userId } = req.user

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
		if (!error.statusCode) {
			error.statusCode = 500
		}
		next(error)
	}
}
