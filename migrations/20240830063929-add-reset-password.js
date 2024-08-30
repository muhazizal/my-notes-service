'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			await queryInterface.addColumn('Users', 'resetPasswordToken', {
				type: Sequelize.STRING,
				allowNull: true,
			})
			await queryInterface.addColumn('Users', 'resetPasswordTokenExpires', {
				type: Sequelize.STRING,
				allowNull: true,
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
			await queryInterface.removeColumn('Users', 'resetPasswordToken')
			await queryInterface.removeColumn('Users', 'resetPasswordTokenExpires')
			await t.commit()
		} catch (error) {
			await t.rollback()
			throw error
		}
	},
}
