import { Test, TestingModule } from '@nestjs/testing';
import { adminCaseController } from './cases.admin.controller';
import { adminCaseService } from './case.admin.service';

describe('adminCaseController', () => {
    let controller: adminCaseController;
    let service: jest.Mocked<adminCaseService>;

    beforeEach(async () => {
        const serviceMock: jest.Mocked<adminCaseService> = {
            assignNewCase: jest.fn(),
            reAssignCase: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [adminCaseController],
            providers: [
                { provide: adminCaseService, useValue: serviceMock },
            ],
        }).compile();

        controller = module.get<adminCaseController>(adminCaseController);
        service = module.get(adminCaseService) as jest.Mocked<adminCaseService>;
    });

    describe('assignNewCase', () => {
        it('should delegate to service.assignNewCase', async () => {
            service.assignNewCase.mockResolvedValueOnce({ caseID: 'case-1' } as any);
            const payload = {
                userToken: { id: 'admin-1', username: 'admin' },
                assignCaseDetails: { assignTo: 'user-1', caseNumber: 'C-1', client: 'client-1' },
            } as any;

            const result = await controller.assignNewCase(payload);
            expect(service.assignNewCase).toHaveBeenCalledWith(payload.userToken, payload.assignCaseDetails);
            expect(result).toEqual({ caseID: 'case-1' });
        });
    });

    describe('reAssignCase', () => {
        it('should delegate to service.reAssignCase', async () => {
            service.reAssignCase.mockResolvedValueOnce({ caseID: 'case-1', assignedTo: { id: 'user-2' } } as any);
            const payload = {
                userToken: { id: 'admin-1', username: 'admin' },
                caseDetails: { assignTo: 'user-2', caseId: 'case-1' },
            } as any;

            const result = await controller.reAssignCase(payload);
            expect(service.reAssignCase).toHaveBeenCalledWith(payload.userToken, payload.caseDetails);
            expect(result).toEqual({ caseID: 'case-1', assignedTo: { id: 'user-2' } });
        });
    });
});


