'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			await queryInterface.dropTable('BlacklistedTokens')
			await t.commit()
		} catch (error) {
			await t.rollback()
			throw error
		}
	},

	async down(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			await queryInterface.createTable('BlacklistedToken', {
				id: {
					allowNull: false,
					autoIncrement: true,
					primaryKey: true,
					type: Sequelize.INTEGER,
				},
				createdAt: {
					allowNull: false,
					type: Sequelize.DATE,
					defaultValue: Sequelize.fn('now'),
				},
				updatedAt: {
					allowNull: false,
					type: Sequelize.DATE,
					defaultValue: Sequelize.fn('now'),
				},
				token: {
					type: Sequelize.STRING,
					allowNull: false,
				},
				expires: {
					type: Sequelize.DATE,
					allowNull: false,
				},
			})
			await t.commit()
		} catch (error) {
			await t.rollback()
			throw error
		}
	},
}
