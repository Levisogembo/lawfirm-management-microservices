import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

describe('ClientsController', () => {
    let controller: ClientsController;
    let service: jest.Mocked<ClientsService>;

    beforeEach(async () => {
        const serviceMock: jest.Mocked<ClientsService> = {
            createClient: jest.fn(),
            getAllClients: jest.fn(),
            searchClientById: jest.fn(),
            updateClient: jest.fn(),
            deleteClient: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ClientsController],
            providers: [{ provide: ClientsService, useValue: serviceMock }],
        }).compile();

        controller = module.get<ClientsController>(ClientsController);
        service = module.get(ClientsService) as jest.Mocked<ClientsService>;
    });

    describe('createNewClient', () => {
        it('should delegate to service.createClient', async () => {
            service.createClient.mockResolvedValueOnce({ clientId: 'c1' } as any);
            const payload = {
                userToken: { id: 'admin' },
                clientDetails: { email: 'e@test.com', clientName: 'A', phoneNumber: '1' },
            } as any;
            const result = await controller.createNewClient(payload);
            expect(service.createClient).toHaveBeenCalledWith(payload.clientDetails);
            expect(result).toEqual({ clientId: 'c1' });
        });
    });

    describe('getAllClients', () => {
        it('should delegate to service.getAllClients', async () => {
            service.getAllClients.mockResolvedValueOnce({ total: 1, page: 1, limit: 10, data: [] } as any);
            const payload = { page: 1, limit: 10 } as any;
            const result = await controller.getAllClients(payload);
            expect(service.getAllClients).toHaveBeenCalledWith(1, 10);
            expect(result).toEqual({ total: 1, page: 1, limit: 10, data: [] });
        });
    });

    describe('getClientById', () => {
        it('should delegate to service.searchClientById', async () => {
            service.searchClientById.mockResolvedValueOnce({ clientId: 'c1' } as any);
            const payload = { id: 'c1' } as any;
            const result = await controller.getClientById(payload);
            expect(service.searchClientById).toHaveBeenCalledWith('c1');
            expect(result).toEqual({ clientId: 'c1' });
        });
    });

    describe('updateClient', () => {
        it('should delegate to service.updateClient', async () => {
            service.updateClient.mockResolvedValueOnce({ clientId: 'c1', phoneNumber: '9' } as any);
            const payload = { id: 'c1', clientDetails: { phoneNumber: '9' } } as any;
            const result = await controller.updateClient(payload);
            expect(service.updateClient).toHaveBeenCalledWith('c1', { phoneNumber: '9' });
            expect(result).toEqual({ clientId: 'c1', phoneNumber: '9' });
        });
    });

    describe('deletedClient', () => {
        it('should delegate to service.deleteClient', async () => {
            service.deleteClient.mockResolvedValueOnce({ affected: 1 } as any);
            const payload = { id: 'c1' } as any;
            const result = await controller.deletedClient(payload);
            expect(service.deleteClient).toHaveBeenCalledWith('c1');
            expect(result).toEqual({ affected: 1 });
        });
    });
});


