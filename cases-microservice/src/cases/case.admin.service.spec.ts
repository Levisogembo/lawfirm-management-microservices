import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { of } from 'rxjs';
import { Repository } from 'typeorm';
import { adminCaseService } from './case.admin.service';
import { Cases } from '../typeorm/entities/Cases';

describe('adminCaseService', () => {
    let service: adminCaseService;

    const repositoryMock: Partial<Record<keyof Repository<any>, jest.Mock>> & any = {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    };

    const natsClientMock = {
        send: jest.fn(),
        emit: jest.fn(),
    } as unknown as ClientProxy;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                adminCaseService,
                {
                    provide: getRepositoryToken(Cases),
                    useValue: repositoryMock,
                },
                {
                    provide: 'Nats_messenger',
                    useValue: natsClientMock,
                },
            ],
        }).compile();

        service = module.get<adminCaseService>(adminCaseService);
    });

    describe('assignNewCase', () => {
        const adminToken = { id: 'admin-1', username: 'admin' } as any;

        it('should assign and return the created case', async () => {
            // found employee to assign
            (natsClientMock.send as any) = jest.fn()
                .mockReturnValueOnce(of({ id: 'user-1', email: 'u1@example.com' })) // getEmployeeById
                .mockReturnValueOnce(of({ clientId: 'client-1', clientName: 'Acme' })); // getClientById

            // unique case number check -> null
            repositoryMock.findOne
                .mockResolvedValueOnce(null) // isCaseNumber
                .mockResolvedValueOnce({
                    caseID: 'case-1',
                    caseTitle: 'Test',
                    client: { clientId: 'client-1', clientName: 'Acme' },
                    assignedTo: { id: 'user-1', username: 'lawyer' },
                }); // final fetch

            repositoryMock.create.mockReturnValue({ caseNumber: 'C-1' });
            repositoryMock.save.mockResolvedValue({ caseID: 'case-1', caseTitle: 'Test' });

            const payload = {
                assignTo: 'user-1',
                caseNumber: 'C-1',
                client: 'client-1',
                caseNotes: ['note-1'],
                caseTitle: 'Test',
            } as any;

            const result = await service.assignNewCase(adminToken, payload);

            expect(natsClientMock.send).toHaveBeenCalledTimes(2);
            expect(natsClientMock.emit).toHaveBeenCalledWith(
                { cmd: 'sendAssignedCaseNotification' },
                expect.objectContaining({ to: 'u1@example.com', assignedBy: 'admin' }),
            );
            expect(repositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
                caseNumber: 'C-1',
                assignedBy: 'admin',
                caseNotes: [{ message: 'note-1' }],
            }));
            expect(result).toEqual({
                caseID: 'case-1',
                caseTitle: 'Test',
                client: { clientId: 'client-1', clientName: 'Acme' },
                assignedTo: { id: 'user-1', username: 'lawyer' },
            });
        });

        it('should throw when user to assign not found', async () => {
            (natsClientMock.send as any) = jest.fn().mockReturnValueOnce(of(null));
            await expect(service.assignNewCase(adminToken, { assignTo: 'u1' } as any))
                .rejects.toBeInstanceOf(RpcException);
        });

        it('should throw when client not found', async () => {
            (natsClientMock.send as any) = jest.fn()
                .mockReturnValueOnce(of({ id: 'u1' }))
                .mockReturnValueOnce(of(null));
            await expect(service.assignNewCase(adminToken, { assignTo: 'u1', client: 'c1' } as any))
                .rejects.toBeInstanceOf(RpcException);
        });

        it('should throw when case number already exists', async () => {
            (natsClientMock.send as any) = jest.fn()
                .mockReturnValueOnce(of({ id: 'u1' }))
                .mockReturnValueOnce(of({ clientId: 'c1' }));
            repositoryMock.findOne.mockResolvedValueOnce({ caseID: 'existing' });
            await expect(service.assignNewCase(adminToken, { assignTo: 'u1', client: 'c1', caseNumber: 'C-1' } as any))
                .rejects.toBeInstanceOf(RpcException);
        });
    });

    describe('reAssignCase', () => {
        const adminToken = { id: 'admin-1', username: 'admin' } as any;

        it('should reassign case and return updated case', async () => {
            (natsClientMock.send as any) = jest.fn()
                .mockReturnValueOnce(of({ id: 'user-2', email: 'u2@example.com', role: { role: 'Lawyer' } })) // getEmployeeById
                .mockReturnValueOnce(of(undefined));

            repositoryMock.findOne
                .mockResolvedValueOnce({ caseID: 'case-1', caseTitle: 'Case' }) // foundCase
                .mockResolvedValueOnce({
                    caseID: 'case-1',
                    client: { clientId: 'client-1', clientName: 'Acme' },
                    assignedTo: { id: 'user-2', username: 'lawyer' },
                }); // fetch after update

            repositoryMock.update.mockResolvedValueOnce(undefined);

            const result = await service.reAssignCase(adminToken, { assignTo: 'user-2', caseId: 'case-1' } as any);

            expect(natsClientMock.send).toHaveBeenCalled();
            expect(natsClientMock.emit).toHaveBeenCalledWith(
                { cmd: 'sendAssignedCaseNotification' },
                expect.objectContaining({ to: 'u2@example.com', assignedBy: 'admin' }),
            );
            expect(repositoryMock.update).toHaveBeenCalledWith(
                { caseID: 'case-1' },
                expect.objectContaining({ assignedBy: 'admin' }),
            );
            expect(result).toEqual({
                caseID: 'case-1',
                client: { clientId: 'client-1', clientName: 'Acme' },
                assignedTo: { id: 'user-2', username: 'lawyer' },
            });
        });

        it('should throw when user to assign not found', async () => {
            (natsClientMock.send as any) = jest.fn().mockReturnValueOnce(of(null));
            await expect(service.reAssignCase(adminToken, { assignTo: 'u2', caseId: 'case-1' } as any))
                .rejects.toBeInstanceOf(RpcException);
        });

        it('should throw when case not found', async () => {
            (natsClientMock.send as any) = jest.fn().mockReturnValueOnce(of({ id: 'u2', role: { role: 'Lawyer' } }));
            repositoryMock.findOne.mockResolvedValueOnce(null);
            await expect(service.reAssignCase(adminToken, { assignTo: 'u2', caseId: 'case-1' } as any))
                .rejects.toBeInstanceOf(RpcException);
        });

        it('should forbid assigning to receptionist role', async () => {
            (natsClientMock.send as any) = jest.fn().mockReturnValueOnce(of({ id: 'u2', role: { role: 'Receptionist' } }));
            repositoryMock.findOne.mockResolvedValueOnce({ caseID: 'case-1' });
            await expect(service.reAssignCase(adminToken, { assignTo: 'u2', caseId: 'case-1' } as any))
                .rejects.toBeInstanceOf(RpcException);
        });
    });
});


