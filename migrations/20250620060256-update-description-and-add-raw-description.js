'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Change 'description' to TEXT
		await queryInterface.changeColumn('Notes', 'description', {
			type: Sequelize.TEXT,
			allowNull: true,
		})

		// Add 'raw_description' column
		await queryInterface.addColumn('Notes', 'raw_description', {
			type: Sequelize.TEXT,
			allowNull: true,
		})
	},

	async down(queryInterface, Sequelize) {
		// Revert 'description' to STRING
		await queryInterface.changeColumn('Notes', 'description', {
			type: Sequelize.STRING,
			allowNull: true,
		})

		// Remove 'raw_description' column
		await queryInterface.removeColumn('Notes', 'raw_description')
	},
}
