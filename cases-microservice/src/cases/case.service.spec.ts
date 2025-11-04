import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { of } from 'rxjs';
import { CasesService } from './cases.service';
import { Cases } from '../typeorm/entities/Cases';

describe('CasesService', () => {
    let service: CasesService;

    const repositoryMock = {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        find: jest.fn(),
        findAndCount: jest.fn(),
    };

    const natsClientMock = {
        send: jest.fn(),
    } as unknown as ClientProxy;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CasesService,
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

        service = module.get<CasesService>(CasesService);
    });

    describe('createNewCase', () => {
        const userToken = { id: 'user-1', username: 'john' } as any;

        it('should create a new case successfully', async () => {
            // user exists
            (natsClientMock.send as any) = jest.fn()
                .mockReturnValueOnce(of({ id: 'user-1', username: 'john' })) // getEmployeeById
                .mockReturnValueOnce(of({ clientId: 'client-1', clientName: 'Acme' })); // getClientById

            // case number unique
            repositoryMock.findOne
                .mockResolvedValueOnce(null) // isCaseNumber
                .mockResolvedValueOnce({
                    caseID: 'case-1',
                    caseNumber: 'C-100',
                    client: { clientId: 'client-1', clientName: 'Acme' },
                    assignedTo: { id: 'user-1', username: 'john' },
                }); // final fetch by caseID with relations

            repositoryMock.create.mockReturnValue({
                caseNumber: 'C-100',
                caseNotes: [{ message: 'note-1' }],
                filedDate: new Date(),
            });
            repositoryMock.save.mockResolvedValue({ caseID: 'case-1' });

            const payload = {
                caseNumber: 'C-100',
                caseNotes: ['note-1'],
                client: 'client-1',
                title: 'Case Title',
            } as any;

            const result = await service.createNewCase(userToken, payload);

            expect(natsClientMock.send).toHaveBeenCalledTimes(2);
            expect(repositoryMock.findOne).toHaveBeenCalled();
            expect(repositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
                caseNumber: 'C-100',
                caseNotes: [{ message: 'note-1' }],
            }));
            expect(repositoryMock.save).toHaveBeenCalled();
            expect(result).toEqual({
                caseID: 'case-1',
                caseNumber: 'C-100',
                client: { clientId: 'client-1', clientName: 'Acme' },
                assignedTo: { id: 'user-1', username: 'john' },
            });
        });

        it('should throw when user is not found', async () => {
            (natsClientMock.send as any) = jest.fn().mockReturnValueOnce(of(null)); // getEmployeeById

            await expect(
                service.createNewCase(userToken, { caseNumber: 'C-1', client: 'client-1' } as any)
            ).rejects.toBeInstanceOf(RpcException);
        });

        it('should throw when case number exists', async () => {
            (natsClientMock.send as any) = jest.fn()
                .mockReturnValueOnce(of({ id: 'user-1' })) // user
                .mockReturnValueOnce(of({ clientId: 'client-1' })); // client

            repositoryMock.findOne.mockResolvedValueOnce({ caseID: 'existing' }); // isCaseNumber

            await expect(
                service.createNewCase(userToken, { caseNumber: 'C-1', client: 'client-1' } as any)
            ).rejects.toBeInstanceOf(RpcException);
        });
    });

    describe('getCaseById', () => {
        it('should return a case when found', async () => {
            repositoryMock.findOne.mockResolvedValueOnce({ caseID: 'case-1' });
            const result = await service.getCaseById('case-1');
            expect(result).toEqual({ caseID: 'case-1' });
        });

        it('should throw when not found', async () => {
            repositoryMock.findOne.mockResolvedValueOnce(null);
            await expect(service.getCaseById('missing'))
                .rejects.toBeInstanceOf(RpcException);
        });
    });

    describe('getCaseNumber', () => {
        it('should return by case number', async () => {
            repositoryMock.findOne.mockResolvedValueOnce({ caseNumber: 'C-1' });
            const result = await service.getCaseNumber('C-1');
            expect(result).toEqual({ caseNumber: 'C-1' });
        });

        it('should throw when not found', async () => {
            repositoryMock.findOne.mockResolvedValueOnce(null);
            await expect(service.getCaseNumber('unknown'))
                .rejects.toBeInstanceOf(RpcException);
        });
    });

    describe('updateCase', () => {
        const userToken = { id: 'user-1', username: 'john' } as any;

        it('should append notes and update when authorized', async () => {
            const existing = {
                caseID: 'case-1',
                caseNotes: [{ message: 'old' }],
                assignedTo: { username: 'john' },
            } as any;

            // getCaseById
            jest.spyOn(service, 'getCaseById').mockResolvedValueOnce(existing as any);

            // client provided => verify call to NATS
            (natsClientMock.send as any) = jest.fn().mockReturnValueOnce(of({ clientId: 'client-2' }));

            repositoryMock.update.mockResolvedValueOnce(undefined);

            const updated = { ...existing, caseNotes: [{ message: 'old' }, { message: 'new-1' }, { message: 'new-2' }] };
            jest.spyOn(service, 'getCaseById').mockResolvedValueOnce(updated as any);

            const result = await service.updateCase(
                'case-1',
                { client: 'client-2', caseNotes: ['new-1', { message: 'new-2' }], title: 'Updated' } as any,
                userToken,
            );

            expect(natsClientMock.send).toHaveBeenCalledTimes(1);
            expect(repositoryMock.update).toHaveBeenCalledWith(
                'case-1',
                expect.objectContaining({
                    caseNotes: [{ message: 'old' }, { message: 'new-1' }, { message: 'new-2' }],
                    title: 'Updated',
                    client: 'client-2',
                }),
            );
            expect(result).toEqual(updated);
        });

        it('should throw when user is not assigned', async () => {
            const existing = {
                caseID: 'case-1',
                caseNotes: [],
                assignedTo: { username: 'mary' },
            } as any;
            jest.spyOn(service, 'getCaseById').mockResolvedValueOnce(existing as any);

            await expect(
                service.updateCase('case-1', { title: 'x' } as any, { id: 'user-1', username: 'john' } as any)
            ).rejects.toBeInstanceOf(RpcException);
        });
    });

    

    describe('getAllCases', () => {
        it('should paginate cases', async () => {
            const data = [{ id: 1 }, { id: 2 }];
            repositoryMock.findAndCount.mockResolvedValueOnce([data, 10]);
            const result = await service.getAllCases(2, 2);
            expect(repositoryMock.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
                skip: 2,
                take: 2,
            }));
            expect(result).toEqual({ total: 10, page: 2, limit: 2, data });
        });
    });

    describe('getMyUpcomingHearings', () => {
        it('should filter upcoming hearings by user', async () => {
            const upcoming = [
                { assignedTo: { id: 'u1' } },
                { assignedTo: { id: 'u2' } },
                { assignedTo: { id: 'u1' } },
            ] as any;
            jest.spyOn(service, 'getUpcomingHearing').mockResolvedValueOnce(upcoming);

            const result = await service.getMyUpcomingHearings({ id: 'u1' } as any);
            expect(result).toEqual([
                { assignedTo: { id: 'u1' } },
                { assignedTo: { id: 'u1' } },
            ]);
        });

        it('should return null if no upcoming hearings', async () => {
            jest.spyOn(service, 'getUpcomingHearing').mockResolvedValueOnce(null as any);
            const result = await service.getMyUpcomingHearings({ id: 'u1' } as any);
            expect(result).toBeNull();
        });
    });
});


