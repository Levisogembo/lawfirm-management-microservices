import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './src/typeorm/entities/User';
import { Roles } from './src/typeorm/entities/Roles';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  port: parseInt(process.env.DB_PORT || '3306'),
  host: process.env.DB_HOST,
  database: process.env.DB_NAME || 'employee_management',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  entities: [User, Roles],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, // Disable synchronize in production
  logging: true,
});
