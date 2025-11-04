import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { createRoleDto, userTokenDto } from './Dtos/createRole.dto';
import { deleteRoleDto } from './Dtos/deleteRole.dto';
import { RpcException } from '@nestjs/microservices';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const mockRolesService = {
    createRole: jest.fn(),
    getRoles: jest.fn(),
    deleteRole: jest.fn()
  };

  const mockUserToken: userTokenDto = {
    id: '1',
    username: 'admin',
    role: 'Admin',
    iat: '1234567890',
    exp: '1234567890'
  };

  const mockRole = {
    id: '1',
    role: 'Lawyer'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService
        }
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createNewRole', () => {
    it('should create a new role successfully', async () => {
      const createRoleData: createRoleDto = {
        userToken: mockUserToken,
        role: 'Lawyer'
      };

      mockRolesService.createRole.mockResolvedValue(mockRole);

      const result = await controller.createNewRole(createRoleData);

      expect(result).toEqual(mockRole);
      expect(mockRolesService.createRole).toHaveBeenCalledWith('Lawyer');
      expect(mockRolesService.createRole).toHaveBeenCalledTimes(1);
    });

    it('should throw RpcException when role creation fails', async () => {
      const createRoleData: createRoleDto = {
        userToken: mockUserToken,
        role: 'Lawyer'
      };

      mockRolesService.createRole.mockRejectedValue(new RpcException('Role already exists'));

      await expect(controller.createNewRole(createRoleData)).rejects.toThrow(RpcException);
      expect(mockRolesService.createRole).toHaveBeenCalledWith('Lawyer');
    });

    it('should handle empty role name', async () => {
      const createRoleData: createRoleDto = {
        userToken: mockUserToken,
        role: ''
      };

      mockRolesService.createRole.mockRejectedValue(new RpcException('Failed to create role'));

      await expect(controller.createNewRole(createRoleData)).rejects.toThrow(RpcException);
      expect(mockRolesService.createRole).toHaveBeenCalledWith('');
    });
  });

  describe('getRoles', () => {
    it('should return all roles successfully', async () => {
      const roles = [mockRole, { id: '2', role: 'Manager' }];
      mockRolesService.getRoles.mockResolvedValue(roles);

      const result = await controller.getRoles();

      expect(result).toEqual(roles);
      expect(mockRolesService.getRoles).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no roles exist', async () => {
      mockRolesService.getRoles.mockResolvedValue([]);

      const result = await controller.getRoles();

      expect(result).toEqual([]);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role successfully', async () => {
      const deleteRoleData: deleteRoleDto = {
        userToken: mockUserToken,
        id: '1'
      };

      mockRolesService.deleteRole.mockResolvedValue(mockRole);

      const result = await controller.deleteRole(deleteRoleData);

      expect(result).toEqual(mockRole);
      expect(mockRolesService.deleteRole).toHaveBeenCalledWith('1');
      expect(mockRolesService.deleteRole).toHaveBeenCalledTimes(1);
    });

    it('should throw RpcException when role is not found', async () => {
      const deleteRoleData: deleteRoleDto = {
        userToken: mockUserToken,
        id: '999'
      };

      mockRolesService.deleteRole.mockRejectedValue(new RpcException('Role not found'));

      await expect(controller.deleteRole(deleteRoleData)).rejects.toThrow(RpcException);
      expect(mockRolesService.deleteRole).toHaveBeenCalledWith('999');
    });

    it('should handle invalid role ID', async () => {
      const deleteRoleData: deleteRoleDto = {
        userToken: mockUserToken,
        id: ''
      };

      mockRolesService.deleteRole.mockRejectedValue(new RpcException('Role not found'));

      await expect(controller.deleteRole(deleteRoleData)).rejects.toThrow(RpcException);
      expect(mockRolesService.deleteRole).toHaveBeenCalledWith('');
    });
  });
});
