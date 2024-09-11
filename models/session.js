'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = () => {
	class Session extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
	}
	Session.init(
		{
			sid: {
				type: DataTypes.STRING(36),
				defaultValue: DataTypes.UUIDV4,
				allowNull: false,
				primaryKey: true,
			},
			accessToken: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			refreshToken: {
				type: DataTypes.STRING,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: 'Session',
		}
	)
	return Session
}
