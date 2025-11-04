import { Test, TestingModule } from '@nestjs/testing';
import { VisitorsController } from './visitors.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('VisitorsController', () => {
  let controller: VisitorsController;
  let natsClient: { send: jest.Mock };

  beforeEach(async () => {
    natsClient = { send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisitorsController],
      providers: [
        { provide: 'Nats_messenger', useValue: natsClient as unknown as ClientProxy },
      ],
    }).compile();

    controller = module.get<VisitorsController>(VisitorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerVisitor', () => {
    it('should create a new visitor and return success response', async () => {
      const req: any = { user: { sub: 'user-id' } };
      const visitorDetails: any = { fullName: 'John Doe', phone: '123', reason: 'Meeting' };
      const created = { id: 'v-1', ...visitorDetails };

      natsClient.send.mockReturnValue(of(created));

      const res = await controller.registerVisitor(req, visitorDetails);

      expect(natsClient.send).toHaveBeenCalledWith(
        { cmd: 'createNewVisitor' },
        { userToken: req.user, visitorDetails },
      );
      expect(res).toEqual({ msg: 'Success', newVisitor: created });
    });
  });

  describe('getAllVisitors', () => {
    it('should return list when visitors exist', async () => {
      const req: any = { user: { sub: 'user-id' } };
      const list = [{ id: 'v1' }, { id: 'v2' }];

      natsClient.send.mockReturnValue(of(list));

      const res = await controller.getAllVisitors(req, 1, 10);

      expect(natsClient.send).toHaveBeenCalledWith(
        { cmd: 'findAllVisitors' },
        { userToken: req.user, page: 1, limit: 10 },
      );
      expect(res).toEqual({ msg: 'success', allVisitors: list });
    });

    it('should return message when no visitors exist', async () => {
      const req: any = { user: { sub: 'user-id' } };
      natsClient.send.mockReturnValue(of([]));

      const res = await controller.getAllVisitors(req, 1, 10);
      expect(res).toEqual({ msg: 'No visitors at the moment' });
    });
  });

  describe('updateVisitor', () => {
    it('should update and return updated visitor', async () => {
      const req: any = { user: { sub: 'user-id' } };
      const visitorId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';
      const visitorDetails: any = { phone: '456' };
      const updated = { id: visitorId, ...visitorDetails };

      natsClient.send.mockReturnValue(of(updated));

      const res = await controller.updateVisitor(visitorId, req, visitorDetails);

      expect(natsClient.send).toHaveBeenCalledWith(
        { cmd: 'updateVisitorDetails' },
        { userToken: req.user, visitorId, visitorDetails },
      );
      expect(res).toEqual({ msg: 'visitor updated successfully', updatedVisitor: updated });
    });
  });

  describe('deleteVisitor', () => {
    it('should delete and return deletion result', async () => {
      const req: any = { user: { sub: 'user-id' } };
      const visitorId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';
      const deletionResult = { acknowledged: true, deletedCount: 1 };

      natsClient.send.mockReturnValue(of(deletionResult));

      const res = await controller.deleteVisitor(visitorId, req);

      expect(natsClient.send).toHaveBeenCalledWith(
        { cmd: 'deleteVisitorDetails' },
        { userToken: req.user, visitorId },
      );
      expect(res).toEqual(deletionResult);
    });
  });

  describe('searchVisitorByName', () => {
    it('should return hits and found visitors', async () => {
      const req: any = { user: { sub: 'user-id' } };
      const name = 'John';
      const hits = [{ id: 'v1', fullName: 'John Doe' }];

      natsClient.send.mockReturnValue(of(hits));

      const res = await controller.searchVisitorByName(name, req);

      expect(natsClient.send).toHaveBeenCalledWith(
        { cmd: 'searchForVisitor' },
        { userToken: req.user, fullName: name },
      );
      expect(res).toEqual({ msg: 'success', hits: hits.length, foundVisitor: hits });
    });
  });
});
