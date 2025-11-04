# User-Role Relationship Migration Guide

## Overview
The user-role relationship has been updated to use proper TypeORM relationships instead of string-based role storage.

## Changes Made

### 1. Entity Updates
- **User Entity**: Removed the `role` string column, added proper `@ManyToOne` relationship with `roles` table
- **Roles Entity**: Added proper `@OneToMany` relationship with cascade options
- **DTO Updates**: Changed `createUserDto` to use `roleId` instead of `Role` string

### 2. Service Updates
- **User Creation**: Now validates role existence and properly links users to roles
- **Role Updates**: Added methods to update user roles
- **Query Improvements**: All user queries now include role information

## Database Migration

### Option 1: Using TypeORM Migrations (Recommended)
```bash
# Run the migration
npm run migration:run

# If you need to revert
npm run migration:revert
```

### Option 2: Using TypeORM Synchronize (Development Only)
The current configuration has `synchronize: true` in `app.module.ts`, which will automatically update your database schema. However, this should be disabled in production.

## Usage Examples

### Creating a User with Role
```typescript
// Create a role first
const role = await rolesService.createRole({ role: 'admin' });

// Create user with role
const user = await userService.createNewUser({
    email: "user@example.com",
    username: "username",
    fullname: "Full Name",
    password: "password123",
    roleId: role.id, // Link to existing role
    phonenumber: "1234567890"
});
```

### Creating a User without Role (Optional)
```typescript
const user = await userService.createNewUser({
    email: "user@example.com",
    username: "username",
    fullname: "Full Name",
    password: "password123",
    // roleId is optional
    phonenumber: "1234567890"
});
```

### Updating User Role
```typescript
// Update user's role
await userService.updateUserRole(userId, newRoleId);

// Or update as part of profile update
await userService.updateProfile({
    email: "newemail@example.com",
    roleId: newRoleId
}, userId);
```

### Querying Users with Roles
```typescript
// Get all users with their roles
const users = await userService.findAllUsers();
// users[0].roles.role will contain the role name

// Get specific user with role
const user = await userService.findUserById(userId);
// user.roles.role will contain the role name
```

## Important Notes

1. **Backup Your Database**: Always backup your database before running migrations
2. **Existing Data**: If you have existing users, you may need to assign them to roles after migration
3. **Production**: Disable `synchronize: true` in production and use migrations instead
4. **Null Roles**: Users can exist without roles (nullable relationship)

## Migration Steps

1. **Backup your database**
2. **Run the migration**: `npm run migration:run`
3. **Update existing users** (if needed):
   ```sql
   -- Assign default role to users without roles
   UPDATE users SET roleId = 'default-role-id' WHERE roleId IS NULL;
   ```
4. **Test your application**
5. **Deploy to production**

## Troubleshooting

### Foreign Key Constraint Errors
If you get foreign key constraint errors, ensure that:
- All role IDs referenced in users table exist in roles table
- The roles table has the correct structure

### Migration Fails
If migration fails:
1. Check database connection
2. Ensure you have proper permissions
3. Verify the migration file is correct
4. Try running in smaller steps

### TypeScript Errors
If you get TypeScript errors:
1. Rebuild the project: `npm run build`
2. Check that all imports are correct
3. Verify entity relationships are properly defined


