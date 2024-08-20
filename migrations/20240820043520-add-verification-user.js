'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			await queryInterface.addColumn('Users', 'isVerified', {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			})
			await queryInterface.addColumn('Users', 'verificationToken', {
				type: Sequelize.STRING,
				allowNull: true,
			})
			await queryInterface.addColumn('Users', 'verificationTokenExpires', {
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
			await queryInterface.removeColumn('Users', 'isVerified')
			await queryInterface.removeColumn('Users', 'verificationToken')
			await queryInterface.removeColumn('Users', 'verificationTokenExpires')
			await t.commit()
		} catch (error) {
			await t.rollback()
			throw error
		}
	},
}
