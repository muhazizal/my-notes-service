'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			// Safely drop Sessions if it exists
			await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "Sessions";`, { transaction: t })
			await t.commit()
		} catch (error) {
			await t.rollback()
			throw error
		}
	},

	async down(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			// Recreate minimal Sessions table (matches current model + token length migration)
			await queryInterface.sequelize.query(
				`
        CREATE TABLE IF NOT EXISTS "Sessions" (
          "sid" VARCHAR(36) PRIMARY KEY,
          "expires" TIMESTAMP WITH TIME ZONE NULL,
          "accessToken" VARCHAR(1024) NOT NULL UNIQUE,
          "refreshToken" VARCHAR(1024) NOT NULL UNIQUE,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        `,
				{ transaction: t }
			)
			await t.commit()
		} catch (error) {
			await t.rollback()
			throw error
		}
	},
}