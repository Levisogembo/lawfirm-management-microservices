 import { Test, TestingModule } from '@nestjs/testing';
 import { TasksController } from './tasks.controller';
 import { ClientProxy } from '@nestjs/microservices';
 import { of } from 'rxjs';
 import { HttpException, NotFoundException } from '@nestjs/common';

 describe('TasksController', () => {
   let controller: TasksController;
   let natsClient: { send: jest.Mock };

   beforeEach(async () => {
     natsClient = { send: jest.fn() };

     const module: TestingModule = await Test.createTestingModule({
       controllers: [TasksController],
       providers: [
         { provide: 'Nats_messenger', useValue: natsClient as unknown as ClientProxy },
       ],
     }).compile();

     controller = module.get<TasksController>(TasksController);
   });

   it('should be defined', () => {
     expect(controller).toBeDefined();
   });

   describe('createNewTask', () => {
     const req: any = { user: { sub: 'user-id' } };
     const taskDetails: any = { name: 'Task A', description: 'Desc' };

     it('should create and return task with success', async () => {
       const task = { id: 't1', ...taskDetails };
       natsClient.send.mockReturnValue(of(task));

       const res = await controller.createNewTask(req, taskDetails);

       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'createNewTask' },
         { userToken: req.user, taskDetails },
       );
       expect(res).toEqual({ msg: 'success', task });
     });

     it('should throw 404 when microservice returns null', async () => {
       natsClient.send.mockReturnValue(of(null));

       await expect(controller.createNewTask(req, taskDetails)).rejects.toEqual(
         new HttpException('user could not be found', 404),
       );
     });
   });

   describe('updateTask', () => {
     const taskId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';
     const payload: any = { name: 'Updated' };

     it('should update and return the task', async () => {
       const updated = { id: taskId, ...payload };
       natsClient.send.mockReturnValue(of(updated));

       const res = await controller.updateTask(taskId, payload);

       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'updateTask' },
         { taskId, payload },
       );
       expect(res).toEqual(updated);
     });

     it('should throw 404 when not found', async () => {
       natsClient.send.mockReturnValue(of(null));
       await expect(controller.updateTask(taskId, payload)).rejects.toEqual(
         new HttpException('Task not found', 404),
       );
     });
   });

   describe('getAllTasks', () => {
     it('should return success with foundTasks when non-empty', async () => {
       const foundTasks = { data: [{ id: 't1' }] };
       natsClient.send.mockReturnValue(of(foundTasks));

       const res = await controller.getAllTasks(1, 10);

       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'getAllTasks' },
         { page: 1, limit: 10 },
       );
       expect(res).toEqual({ msg: 'success', foundTasks });
     });

     it('should return message when empty list', async () => {
       const foundTasks = { data: [] };
       natsClient.send.mockReturnValue(of(foundTasks));

       const res = await controller.getAllTasks(1, 10);
       expect(res).toEqual({ msg: 'No tasks found' });
     });

     it('should return NotFoundException instance when microservice returns falsy', async () => {
       natsClient.send.mockReturnValue(of(null));

       const res = await controller.getAllTasks(1, 10);
       expect(res).toBeInstanceOf(NotFoundException);
     });
   });

   describe('getPendingTasks', () => {
     const req: any = { user: { sub: 'user-id' } };

     it('should return hits and list when there are pending tasks', async () => {
       const pending = [{ id: 't1' }, { id: 't2' }];
       natsClient.send.mockReturnValue(of(pending));

       const res = await controller.getPendingTasks(req);

       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'getPendingTasks' },
         req.user,
       );
       expect(res).toEqual({ hits: pending.length, pendingTasks: pending });
     });

     it('should return message when no pending tasks', async () => {
       natsClient.send.mockReturnValue(of([]));
       const res = await controller.getPendingTasks(req);
       expect(res).toEqual({ msg: 'No pending tasks' });
     });
   });

   describe('myTasks', () => {
     const req: any = { user: { sub: 'user-id' } };

     it('should return hits and myTask when non-empty', async () => {
       const myTask = [{ id: 't1' }];
       natsClient.send.mockReturnValue(of(myTask));

       const res = await controller.myTasks(req);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'getMyTasks' },
         req.user,
       );
       expect(res).toEqual({ hits: myTask.length, myTask });
     });

     it('should return message when empty array', async () => {
       natsClient.send.mockReturnValue(of([]));
       const res = await controller.myTasks(req);
       expect(res).toEqual({ msg: 'No pending tasks today' });
     });

     it('should return HttpException 404 when microservice returns falsy', async () => {
       natsClient.send.mockReturnValue(of(null));
       const res = await controller.myTasks(req);
       expect(res).toBeInstanceOf(HttpException);
       expect((res as HttpException).getStatus()).toBe(404);
     });
   });
 });
