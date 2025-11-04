import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserRoleRelationship1700000000000 implements MigrationInterface {
    name = 'UpdateUserRoleRelationship1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add roleId column if it doesn't exist
        const hasRoleIdColumn = await queryRunner.hasColumn('users', 'roleId');
        if (!hasRoleIdColumn) {
            await queryRunner.query(`ALTER TABLE \`users\` ADD \`roleId\` varchar(36) NULL`);
        }

        // Add foreign key constraint if it doesn't exist
        const hasForeignKey = await queryRunner.hasColumn('users', 'roleId');
        if (hasForeignKey) {
            try {
                await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_user_role\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
            } catch (error) {
                // Foreign key might already exist
                console.log('Foreign key constraint might already exist:', error.message);
            }
        }

        // Remove old role column if it exists
        const hasOldRoleColumn = await queryRunner.hasColumn('users', 'role');
        if (hasOldRoleColumn) {
            await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`role\``);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate old role column
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`role\` varchar(255) NULL`);

        // Remove foreign key constraint
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_user_role\``);

        // Remove roleId column
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`roleId\``);
    }
}


