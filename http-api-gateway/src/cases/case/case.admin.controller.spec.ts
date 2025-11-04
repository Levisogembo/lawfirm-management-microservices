 import { Test, TestingModule } from '@nestjs/testing';
 import { adminCaseController } from './case.admin.controller';
 import { ClientProxy } from '@nestjs/microservices';
 import { of } from 'rxjs';

 describe('adminCaseController', () => {
   let controller: adminCaseController;
   let natsClient: { send: jest.Mock };

   beforeEach(async () => {
     natsClient = { send: jest.fn() };

     const module: TestingModule = await Test.createTestingModule({
       controllers: [adminCaseController],
       providers: [
         { provide: 'Nats_messenger', useValue: natsClient as unknown as ClientProxy },
       ],
     }).compile();

     controller = module.get<adminCaseController>(adminCaseController);
   });

   it('should be defined', () => {
     expect(controller).toBeDefined();
   });

   describe('assignNewCase', () => {
     it('should assign and return success', async () => {
       const req: any = { user: { sub: 'admin' } };
       const assignCaseDetails: any = { caseNumber: 'C-1', userId: 'u1' };
       const assignedCase = { id: 'case1' };
       natsClient.send.mockReturnValue(of(assignedCase));

       const res = await controller.assignNewCase(req, assignCaseDetails);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'assignNewCase' },
         { userToken: req.user, assignCaseDetails },
       );
       expect(res).toEqual({ msg: 'success', assignedCase });
     });
   });

   describe('reAssignCase', () => {
     it('should reassign and return success', async () => {
       const req: any = { user: { sub: 'admin' } };
       const caseDetails: any = { caseId: 'case1', newUserId: 'u2' };
       const reAssignedCase = { id: 'case1', userId: 'u2' };
       natsClient.send.mockReturnValue(of(reAssignedCase));

       const res = await controller.reAssignCase(req, caseDetails);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'reAssignNewCase' },
         { userToken: req.user, caseDetails },
       );
       expect(res).toEqual({ msg: 'success', reAssignedCase });
     });
   });
 });
