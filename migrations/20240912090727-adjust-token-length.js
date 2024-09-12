'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			await queryInterface.changeColumn('Sessions', 'accessToken', {
				type: Sequelize.STRING(1024),
				allowNull: false,
				unique: true,
			})
			await queryInterface.changeColumn('Sessions', 'refreshToken', {
				type: Sequelize.STRING(1024),
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
