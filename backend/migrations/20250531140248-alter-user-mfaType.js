'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the default constraint on the column (if one exists) to avoid issues during conversion.
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users"
      ALTER COLUMN "mfaType" DROP DEFAULT;
    `);

    // Change the type of mfaType from a single ENUM to an array of ENUM values.
    // The USING clause converts the existing value: if not null, wrap it in an array.
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users"
      ALTER COLUMN "mfaType" TYPE "enum_Users_mfaType"[]
      USING (CASE WHEN "mfaType" IS NOT NULL THEN ARRAY["mfaType"]::"enum_Users_mfaType"[] ELSE NULL END);
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert the change: Convert the array back to a single ENUM value by selecting the first element.
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users"
      ALTER COLUMN "mfaType" TYPE "enum_Users_mfaType"
      USING (CASE WHEN "mfaType" IS NOT NULL THEN "mfaType"[1] ELSE NULL END);
    `);
  }
};
