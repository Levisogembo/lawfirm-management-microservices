 import { Test, TestingModule } from '@nestjs/testing';
 import { adminTasksController } from './tasks.admin.controller';
 import { ClientProxy } from '@nestjs/microservices';
 import { of, throwError } from 'rxjs';
 import { ConflictException } from '@nestjs/common';

 describe('adminTasksController', () => {
   let controller: adminTasksController;
   let natsClient: { send: jest.Mock };

   beforeEach(async () => {
     natsClient = { send: jest.fn() };

     const module: TestingModule = await Test.createTestingModule({
       controllers: [adminTasksController],
       providers: [
         { provide: 'Nats_messenger', useValue: natsClient as unknown as ClientProxy },
       ],
     }).compile();

     controller = module.get<adminTasksController>(adminTasksController);
   });

   it('should be defined', () => {
     expect(controller).toBeDefined();
   });

   describe('assignTasks', () => {
     const req: any = { user: { sub: 'admin-user' } };
     const payload: any = { name: 'New Task', assigneeId: 'u1' };

     it('should assign a task successfully', async () => {
       const assignedTask = { id: 't1', ...payload };
       natsClient.send.mockReturnValue(of(assignedTask));

       const res = await controller.assignTasks(req, payload);

       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'assignNewTask' },
         { userToken: req.user, taskDetails: payload },
       );
       expect(res).toEqual({ msg: 'Task Assigned Successfully', assignedTask });
     });

     it('should map duplicate name error to ConflictException', async () => {
       natsClient.send.mockReturnValue(
         throwError(() => ({ message: 'Task Name Already exists' } as any)),
       );

       await expect(controller.assignTasks(req, payload)).rejects.toBeInstanceOf(
         ConflictException,
       );
     });

     it('should map forbidden resource error to ConflictException', async () => {
       natsClient.send.mockReturnValue(
         throwError(() => ({ message: 'Forbidden resource' } as any)),
       );

       await expect(controller.assignTasks(req, payload)).rejects.toBeInstanceOf(
         ConflictException,
       );
     });

     it('should rethrow unknown errors', async () => {
       const err = new Error('Some other error');
       natsClient.send.mockReturnValue(throwError(() => err));

       await expect(controller.assignTasks(req, payload)).rejects.toBe(err);
     });
   });
 });
