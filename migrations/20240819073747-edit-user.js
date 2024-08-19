'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.removeColumn('Users', 'firstName')
		await queryInterface.addColumn('Users', 'username', {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true,
		})
		await queryInterface.addColumn('Users', 'password', {
			type: Sequelize.STRING,
			allowNull: false,
		})
		await queryInterface.addColumn('Users', 'fullname', {
			type: Sequelize.STRING,
			allowNull: false,
		})
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.addColumn('Users', 'firstName', {
			firstName: {
				type: Sequelize.STRING,
			},
		})
		await queryInterface.removeColumn('Users', 'username')
		await queryInterface.removeColumn('Users', 'password')
		await queryInterface.removeColumn('Users', 'fullname')
	},
}
