'use strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = () => {
	class User extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			this.hasMany(models.Note, {
				foreignKey: 'userId',
				as: 'notes',
			})
		}
	}
	User.init(
		{
			username: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			password: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			fullname: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			isVerified: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			verificationToken: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			verificationTokenExpires: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			resetPasswordToken: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			resetPasswordTokenExpires: {
				type: DataTypes.STRING,
				allowNull: true,
			},
		},
		{
			sequelize,
			modelName: 'User',
		}
	)
	return User
}
