import { Test, TestingModule } from '@nestjs/testing';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';

describe('CasesController', () => {
    let controller: CasesController;
    let service: jest.Mocked<CasesService>;

    beforeEach(async () => {
        const serviceMock: jest.Mocked<CasesService> = {
            createNewCase: jest.fn(),
            getCaseById: jest.fn(),
            getCaseNumber: jest.fn(),
            updateCase: jest.fn(),
            getUpcomingHearing: jest.fn(),
            getAllCases: jest.fn(),
            getMyUpcomingHearings: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CasesController],
            providers: [
                { provide: CasesService, useValue: serviceMock },
            ],
        }).compile();

        controller = module.get<CasesController>(CasesController);
        service = module.get(CasesService) as jest.Mocked<CasesService>;
    });

    describe('createNewCase', () => {
        it('should delegate to service.createNewCase', async () => {
            service.createNewCase.mockResolvedValueOnce({ id: 'case-1' } as any);
            const dto = {
                userToken: { id: 'u1' },
                caseDetails: { caseNumber: 'C-1', client: 'c1' },
            } as any;

            const result = await controller.createNewCase(dto);
            expect(service.createNewCase).toHaveBeenCalledWith(dto.userToken, dto.caseDetails);
            expect(result).toEqual({ id: 'case-1' });
        });
    });

    describe('getCaseById', () => {
        it('should delegate to service.getCaseById', async () => {
            service.getCaseById.mockResolvedValueOnce({ caseID: 'case-1' } as any);
            const payload = { caseId: 'case-1' } as any;
            const result = await controller.getCaseById(payload);
            expect(service.getCaseById).toHaveBeenCalledWith('case-1');
            expect(result).toEqual({ caseID: 'case-1' });
        });
    });

    describe('getCaseByNumber', () => {
        it('should delegate to service.getCaseNumber', async () => {
            service.getCaseNumber.mockResolvedValueOnce({ caseNumber: 'C-1' } as any);
            const payload = { caseNumber: 'C-1' } as any;
            const result = await controller.getCaseByNumber(payload);
            expect(service.getCaseNumber).toHaveBeenCalledWith('C-1');
            expect(result).toEqual({ caseNumber: 'C-1' });
        });
    });

    describe('updateCase', () => {
        it('should delegate to service.updateCase', async () => {
            service.updateCase.mockResolvedValueOnce({ caseID: 'case-1', title: 'Updated' } as any);
            const payload = {
                caseId: 'case-1',
                caseUpdateDetails: { title: 'Updated' },
                userToken: { id: 'u1', username: 'john' },
            } as any;
            const result = await controller.updateCase(payload);
            expect(service.updateCase).toHaveBeenCalledWith('case-1', { title: 'Updated' }, { id: 'u1', username: 'john' });
            expect(result).toEqual({ caseID: 'case-1', title: 'Updated' });
        });
    });

    describe('getUpcomingHearings', () => {
        it('should delegate to service.getUpcomingHearing', async () => {
            service.getUpcomingHearing.mockResolvedValueOnce([{ id: 1 }] as any);
            const result = await controller.getUpcomingHearings();
            expect(service.getUpcomingHearing).toHaveBeenCalled();
            expect(result).toEqual([{ id: 1 }]);
        });
    });

    describe('getAllCases', () => {
        it('should delegate to service.getAllCases', async () => {
            service.getAllCases.mockResolvedValueOnce({ total: 1, page: 1, limit: 10, data: [] } as any);
            const payload = { page: 1, limit: 10 } as any;
            const result = await controller.getAllCases(payload);
            expect(service.getAllCases).toHaveBeenCalledWith(1, 10);
            expect(result).toEqual({ total: 1, page: 1, limit: 10, data: [] });
        });
    });

    describe('getMyHearings', () => {
        it('should delegate to service.getMyUpcomingHearings', async () => {
            service.getMyUpcomingHearings.mockResolvedValueOnce([{ id: 'h1' }] as any);
            const payload = { userToken: { id: 'u1' } } as any;
            const result = await controller.getMyHearings(payload);
            expect(service.getMyUpcomingHearings).toHaveBeenCalledWith({ id: 'u1' });
            expect(result).toEqual([{ id: 'h1' }]);
        });
    });
});


