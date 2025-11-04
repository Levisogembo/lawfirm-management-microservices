import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { Repository } from 'typeorm';
import { Roles } from '../typeorm/entities/Roles';
import { getRepositoryToken } from '@nestjs/typeorm';

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn()
}

const mockRole = {
  id:'123',
  role: 'Lawyer'
}

describe('RolesService', () => {
  let service: RolesService;
  let repository: Repository<Roles>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Roles),
          useValue: mockRepository
        },
        RolesService],
    }).compile();

    service = module.get<RolesService>(RolesService);
    repository = module.get<Repository<Roles>>(getRepositoryToken(Roles))
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new role', async () => {
    const roleData = { role: 'Lawyer' };
    const createdRole = { id: '123', ...roleData };
    
    (repository.findOne as jest.Mock).mockResolvedValue(null);
    (repository.create as jest.Mock).mockReturnValue(roleData);
    (repository.save as jest.Mock).mockResolvedValue(createdRole);
    
    const result = await service.createRole(roleData);
    
    expect(result).toEqual(createdRole);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { role: 'Lawyer' } });
    expect(repository.create).toHaveBeenCalledWith(roleData);
    expect(repository.save).toHaveBeenCalledWith(roleData);
  });

  it('should throw error when role already exists', async () => {
    const roleData = { role: 'Lawyer' };
    const existingRole = { id: '123', role: 'Lawyer' };
    (repository.findOne as jest.Mock).mockResolvedValue(existingRole);  
    await expect(service.createRole(roleData)).rejects.toThrow('Role already exists');
  });

  it('should get all roles', async () => {
    const roles = [mockRole];
    (repository.find as jest.Mock).mockResolvedValue(roles);
    
    const result = await service.getRoles();
    
    expect(result).toEqual(roles);
    expect(repository.find).toHaveBeenCalled();
  });

  it('should delete a role', async () => {
    const roleId = '123';
    (repository.findOne as jest.Mock).mockResolvedValue(mockRole);
    (repository.delete as jest.Mock).mockResolvedValue({ affected: 1 });
    
    const result = await service.deleteRole(roleId);
    
    expect(result).toEqual(mockRole);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: roleId } });
    expect(repository.delete).toHaveBeenCalledWith(roleId);
  });

  it('should throw error when deleting non-existent role', async () => {
    const roleId = '999';
    (repository.findOne as jest.Mock).mockResolvedValue(null);
    
    await expect(service.deleteRole(roleId)).rejects.toThrow('Role not found');
  });
});
