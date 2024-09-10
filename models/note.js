'use strict'

const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = () => {
	class Note extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			this.belongsTo(models.User, {
				foreignKey: 'userId',
				as: 'user',
			})
		}
	}
	Note.init(
		{
			title: DataTypes.STRING,
			description: DataTypes.STRING,
		},
		{
			sequelize,
			modelName: 'Note',
			indexes: [
				{
					name: 'Notes_user_id_index',
					fields: ['userId'],
				},
			],
		}
	)
	return Note
}
