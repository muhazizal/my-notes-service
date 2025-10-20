'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			// verificationTokenExpires → BIGINT (cast only numeric strings, else NULL)
			await queryInterface.sequelize.query(
				`
        ALTER TABLE "Users"
        ALTER COLUMN "verificationTokenExpires" TYPE BIGINT
        USING CASE
          WHEN "verificationTokenExpires" ~ '^[0-9]+$' THEN "verificationTokenExpires"::bigint
          ELSE NULL
        END;
        `,
				{ transaction: t }
			)

			// resetPasswordTokenExpires → BIGINT (same casting logic)
			await queryInterface.sequelize.query(
				`
        ALTER TABLE "Users"
        ALTER COLUMN "resetPasswordTokenExpires" TYPE BIGINT
        USING CASE
          WHEN "resetPasswordTokenExpires" ~ '^[0-9]+$' THEN "resetPasswordTokenExpires"::bigint
          ELSE NULL
        END;
        `,
				{ transaction: t }
			)

			await t.commit()
		} catch (error) {
			await t.rollback()
			throw error
		}
	},

	async down(queryInterface, Sequelize) {
		const t = await queryInterface.sequelize.transaction()
		try {
			await queryInterface.sequelize.query(
				`
        ALTER TABLE "Users"
        ALTER COLUMN "verificationTokenExpires" TYPE VARCHAR
        USING "verificationTokenExpires"::text;
        `,
				{ transaction: t }
			)

			await queryInterface.sequelize.query(
				`
        ALTER TABLE "Users"
        ALTER COLUMN "resetPasswordTokenExpires" TYPE VARCHAR
        USING "resetPasswordTokenExpires"::text;
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