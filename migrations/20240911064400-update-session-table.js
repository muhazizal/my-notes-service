'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			await queryInterface.addColumn('Sessions', 'accessToken', {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			})
			await queryInterface.addColumn('Sessions', 'refreshToken', {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
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
			await t.commit()
		} catch (error) {
			await t.rollback()
			throw error
		}
	},
}
