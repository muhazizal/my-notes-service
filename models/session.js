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
			accessToken: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			refreshToken: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			refreshTokenExpires: {
				type: DataTypes.DATE,
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
