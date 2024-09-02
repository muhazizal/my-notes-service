'use-strict'
const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = () => {
	class BlacklistedToken extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
		}
	}
	BlacklistedToken.init(
		{
			token: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			expires: {
				type: DataTypes.DATE,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: 'BlacklistedToken',
		}
	)
	return BlacklistedToken
}
