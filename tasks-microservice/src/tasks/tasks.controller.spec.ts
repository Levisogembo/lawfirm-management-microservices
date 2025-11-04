import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

const fakeUserToken = {
  id: 'user-1',
  username: 'john',
  role: 'Admin',
  isVerified: true,
  iat: '1759494506',
  exp: '1759498106',
};

const mockTasksService = {
  createTask: jest.fn(),
  updateTask: jest.fn(),
  getAllTasks: jest.fn(),
  findPendingTasks: jest.fn(),
  getMyTasks: jest.fn(),
};

describe('TasksController', () => {
  let controller: TasksController;
  let service: typeof mockTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService) as any;

    jest.clearAllMocks();
  });

  it('createNewTask should call service with user id and task details', async () => {
    const taskDetails = {
      name: 'Draft contract',
      description: 'Prepare contract draft',
      priority: 'High',
      notes: ['Initial brief'],
    } as any;

    (service.createTask as jest.Mock).mockResolvedValue({ taskId: 't1', name: taskDetails.name });

    const result = await controller.createNewTask({ userToken: fakeUserToken, taskDetails } as any);

    expect(service.createTask).toHaveBeenCalledWith(fakeUserToken.id, taskDetails);
    expect(result).toEqual({ taskId: 't1', name: taskDetails.name });
  });

  it('updateTask should forward payload to service', async () => {
    const payload = { taskId: 't1', payload: { status: 'InProgress', notes: ['Started'] } } as any;
    (service.updateTask as jest.Mock).mockResolvedValue({ taskId: 't1', status: 'InProgress' });

    const result = await controller.updateTask(payload);

    expect(service.updateTask).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ taskId: 't1', status: 'InProgress' });
  });

  it('getAllTasks should request page and limit', async () => {
    (service.getAllTasks as jest.Mock).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

    const result = await controller.getAllTasks({ page: 1, limit: 10 } as any);

    expect(service.getAllTasks).toHaveBeenCalledWith(1, 10);
    expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
  });

  it('getPendingTasks should call service with user id', async () => {
    (service.findPendingTasks as jest.Mock).mockResolvedValue([{ taskId: 't1' }]);

    const result = await controller.getPendingTasks({ id: fakeUserToken.id } as any);

    expect(service.findPendingTasks).toHaveBeenCalledWith(fakeUserToken.id);
    expect(result).toEqual([{ taskId: 't1' }]);
  });

  it('myTasks should call service with user id', async () => {
    (service.getMyTasks as jest.Mock).mockResolvedValue([{ taskId: 't2' }]);

    const result = await controller.myTasks({ id: fakeUserToken.id } as any);

    expect(service.getMyTasks).toHaveBeenCalledWith(fakeUserToken.id);
    expect(result).toEqual([{ taskId: 't2' }]);
  });
});


