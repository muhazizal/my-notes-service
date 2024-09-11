'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			await queryInterface.addColumn('Sessions', 'accessToken', {
				type: Sequelize.STRING,
				allowNull: false,
			})
			await queryInterface.addColumn('Sessions', 'refreshToken', {
				type: Sequelize.STRING,
				allowNull: false,
			})
			await queryInterface.addColumn('Sessions', 'refreshTokenExpires', {
				type: Sequelize.DATE,
				allowNull: false,
			})
			await t.commit()
		} catch (error) {
			await t.rollback()
			throw error
		}
	},

	async down(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			await queryInterface.removeColumn('Sessions', 'accessToken')
			await queryInterface.removeColumn('Sessions', 'refreshToken')
			await queryInterface.removeColumn('Sessions', 'refreshTokenExpires')
			await t.commit()
		} catch (error) {
			await t.rollback()
			throw error
		}
	},
}
