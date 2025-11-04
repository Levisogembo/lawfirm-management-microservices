 import { Test, TestingModule } from '@nestjs/testing';
 import { CaseController } from './case.controller';
 import { ClientProxy } from '@nestjs/microservices';
 import { of } from 'rxjs';

 describe('CaseController', () => {
   let controller: CaseController;
   let natsClient: { send: jest.Mock };

   beforeEach(async () => {
     natsClient = { send: jest.fn() };

     const module: TestingModule = await Test.createTestingModule({
       controllers: [CaseController],
       providers: [
         { provide: 'Nats_messenger', useValue: natsClient as unknown as ClientProxy },
       ],
     }).compile();

     controller = module.get<CaseController>(CaseController);
   });

   it('should be defined', () => {
     expect(controller).toBeDefined();
   });

   describe('createNewCase', () => {
     it('should create a case and return success message', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const caseDetails: any = { caseNumber: 'C-1', clientId: 'c1' };
       const newCase = { id: 'case1', ...caseDetails };

       natsClient.send.mockReturnValue(of(newCase));

       const res = await controller.createNewCase(req, caseDetails);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'createNewCase' },
         { userToken: req.user, caseDetails },
       );
       expect(res).toEqual({ msg: 'New Case Created', newCase });
     });
   });

   describe('getCaseById', () => {
     it('should return success and foundCase', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const caseId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';
       const foundCase = { id: caseId };
       natsClient.send.mockReturnValue(of(foundCase));

       const res = await controller.getCaseById(req, caseId);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'searchCaseById' },
         { userToken: req.user, caseId },
       );
       expect(res).toEqual({ msg: 'success', foundCase });
     });
   });

   describe('getCaseNumber', () => {
     it('should return success and foundCase by case number', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const caseNumber = 'C-1';
       const foundCase = { id: 'case1', caseNumber };
       natsClient.send.mockReturnValue(of(foundCase));

       const res = await controller.getCaseNumber(req, caseNumber);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'searchCaseByCaseNum' },
         { userToken: req.user, caseNumber },
       );
       expect(res).toEqual({ msg: 'success', foundCase });
     });
   });

   describe('updateCase', () => {
     it('should update and return updatedCase', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const caseId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';
       const caseUpdateDetails: any = { title: 'New Title' };
       const updatedCase = { id: caseId, ...caseUpdateDetails };
       natsClient.send.mockReturnValue(of(updatedCase));

       const res = await controller.updateCase(req, caseUpdateDetails, caseId);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'updatedCaseDetails' },
         { userToken: req.user, caseUpdateDetails, caseId },
       );
       expect(res).toEqual(updatedCase);
     });
   });

   describe('getUpcomingHearings', () => {
     it('should return hits when there are upcoming mentions', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const upcomingMentions = [{ id: 'h1' }, { id: 'h2' }];
       natsClient.send.mockReturnValue(of(upcomingMentions));

       const res = await controller.getUpcomingHearings(req);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'getUpcomingHearings' },
         { userToken: req.user },
       );
       expect(res).toEqual({ msg: 'success', hits: upcomingMentions.length, upcomingMentions });
     });

     it('should return message when none', async () => {
       const req: any = { user: { sub: 'user-id' } };
       natsClient.send.mockReturnValue(of([]));
       const res = await controller.getUpcomingHearings(req);
       expect(res).toEqual({ msg: 'No upcoming hearings this week' });
     });
   });

   describe('getAllCases', () => {
     it('should return success when data has items', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const allCases = { data: [{ id: 'case1' }] };
       natsClient.send.mockReturnValue(of(allCases));

       const res = await controller.getAllCases(req, '1' as any, '10' as any);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'getAllCases' },
         { userToken: req.user, page: '1', limit: '10' },
       );
       expect(res).toEqual({ msg: 'success', allCases });
     });

     it('should return message when no cases available', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const allCases = { data: [] };
       natsClient.send.mockReturnValue(of(allCases));
       const res = await controller.getAllCases(req, '1' as any, '10' as any);
       expect(res).toEqual({ msg: 'No cases available' });
     });
   });

   describe('getMyHearings', () => {
     it('should return hits when my hearings exist', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const myHearing = [{ id: 'h1' }];
       natsClient.send.mockReturnValue(of(myHearing));

       const res = await controller.getMyHearings(req);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'searchMyHearings' },
         { userToken: req.user },
       );
       expect(res).toEqual({ msg: 'success', hits: myHearing.length, myHearing });
     });

     it('should return message when none', async () => {
       const req: any = { user: { sub: 'user-id' } };
       natsClient.send.mockReturnValue(of([]));
       const res = await controller.getMyHearings(req);
       expect(res).toEqual({ msg: 'No upcoming hearings this week' });
     });
   });
 });
