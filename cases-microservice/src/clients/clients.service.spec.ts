import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { ClientsService } from './clients.service';
import { Clients } from '../typeorm/entities/Clients';

describe('ClientsService', () => {
    let service: ClientsService;

    const repositoryMock: Partial<Record<keyof Repository<any>, jest.Mock>> & any = {
        findOne: jest.fn(),
        findAndCount: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClientsService,
                {
                    provide: getRepositoryToken(Clients),
                    useValue: repositoryMock,
                },
            ],
        }).compile();

        service = module.get<ClientsService>(ClientsService);
    });

    describe('createClient', () => {
        it('should throw if email exists', async () => {
            repositoryMock.findOne.mockResolvedValueOnce({ clientId: 'c1' });
            await expect(service.createClient({ email: 'e@test.com', clientName: 'A', phoneNumber: '1' } as any))
                .rejects.toBeInstanceOf(RpcException);
        });

        it('should create and save when email unique', async () => {
            repositoryMock.findOne.mockResolvedValueOnce(null);
            const created = { email: 'e@test.com' };
            repositoryMock.create.mockReturnValueOnce(created);
            repositoryMock.save.mockResolvedValueOnce({ clientId: 'c1', ...created });

            const result = await service.createClient({ email: 'e@test.com', clientName: 'A', phoneNumber: '1' } as any);

            expect(repositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'e@test.com' }));
            expect(repositoryMock.save).toHaveBeenCalledWith(created);
            expect(result).toEqual({ clientId: 'c1', email: 'e@test.com' });
        });
    });

    describe('getAllClients', () => {
        it('should paginate results', async () => {
            repositoryMock.findAndCount.mockResolvedValueOnce([[{ id: 1 }], 5]);
            const result = await service.getAllClients(2, 2);
            expect(repositoryMock.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 2, take: 2 }));
            expect(result).toEqual({ total: 5, page: 2, limit: 2, data: [{ id: 1 }] });
        });
    });

    describe('searchClientById', () => {
        it('should return client when found', async () => {
            repositoryMock.findOne.mockResolvedValueOnce({ clientId: 'c1' });
            const result = await service.searchClientById('c1');
            expect(result).toEqual({ clientId: 'c1' });
        });

        it('should throw when not found', async () => {
            repositoryMock.findOne.mockResolvedValueOnce(null);
            await expect(service.searchClientById('missing')).rejects.toBeInstanceOf(RpcException);
        });
    });

    describe('updateClient', () => {
        it('should throw when client not found', async () => {
            jest.spyOn(service, 'searchClientById').mockResolvedValueOnce(null as any);
            await expect(service.updateClient('c1', { email: 'x@test.com' } as any)).rejects.toBeInstanceOf(RpcException);
        });

        it('should throw if email already taken', async () => {
            jest.spyOn(service, 'searchClientById').mockResolvedValueOnce({ clientId: 'c1' } as any);
            repositoryMock.findOne.mockResolvedValueOnce({ clientId: 'other' });
            await expect(service.updateClient('c1', { email: 'x@test.com' } as any)).rejects.toBeInstanceOf(RpcException);
        });

        it('should update only provided fields and return updated client', async () => {
            jest.spyOn(service, 'searchClientById').mockResolvedValueOnce({ clientId: 'c1' } as any);
            repositoryMock.findOne.mockResolvedValueOnce(null); // email check returns null (unique)
            repositoryMock.update.mockResolvedValueOnce(undefined);
            repositoryMock.findOne.mockResolvedValueOnce({ clientId: 'c1', phoneNumber: '999' });

            const result = await service.updateClient('c1', { phoneNumber: '999' } as any);

            expect(repositoryMock.update).toHaveBeenCalledWith('c1', { phoneNumber: '999' });
            
        });
    });

    describe('deleteClient', () => {
        it('should throw when client not found', async () => {
            jest.spyOn(service, 'searchClientById').mockResolvedValueOnce(null as any);
            await expect(service.deleteClient('c1')).rejects.toBeInstanceOf(RpcException);
        });

        it('should delete when found', async () => {
            jest.spyOn(service, 'searchClientById').mockResolvedValueOnce({ clientId: 'c1' } as any);
            repositoryMock.delete.mockResolvedValueOnce({ affected: 1 });
            const result = await service.deleteClient('c1');
            expect(repositoryMock.delete).toHaveBeenCalledWith('c1');
            expect(result).toEqual({ affected: 1 });
        });
    });
});


