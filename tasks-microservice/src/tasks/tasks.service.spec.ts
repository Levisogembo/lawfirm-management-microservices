import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Tasks } from '../typeorm/entities/Tasks';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

describe('TasksService', () => {
  let service: TasksService;

  const mockRepo = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockNats: Partial<ClientProxy> = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Tasks), useValue: mockRepo },
        { provide: 'Nats_messenger', useValue: mockNats },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    const userId = 'u1';
    const dto: any = {
      name: 'Task A',
      description: 'Desc',
      notes: ['Note 1', { message: 'Note 2' }],
      priority: 'High',
    };

    it('creates a task when user exists and name unique', async () => {
      (mockNats.send as jest.Mock).mockReturnValue(of({ id: userId, username: 'john' }));
      (mockRepo.findOne as jest.Mock).mockResolvedValueOnce(null); // name unique
      (mockRepo.create as jest.Mock).mockImplementation((payload) => ({ taskId: 't1', ...payload }));
      (mockRepo.save as jest.Mock).mockResolvedValue({ taskId: 't1' });
      (mockRepo.findOne as jest.Mock).mockResolvedValueOnce({ taskId: 't1', assignedTo: { username: 'john' } });

      const result = await service.createTask(userId, dto);

      expect(mockNats.send).toHaveBeenCalledWith({ cmd: 'getEmployeeById' }, userId);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { name: dto.name } });
      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toEqual({ taskId: 't1', assignedTo: { username: 'john' } });
    });

    it('throws when user not found', async () => {
      (mockNats.send as jest.Mock).mockReturnValue(of(null));

      await expect(service.createTask(userId, dto)).rejects.toBeInstanceOf(RpcException);
    });

    it('throws when task name exists', async () => {
      (mockNats.send as jest.Mock).mockReturnValue(of({ id: userId }));
      (mockRepo.findOne as jest.Mock).mockResolvedValueOnce({ taskId: 't2' });

      await expect(service.createTask(userId, dto)).rejects.toBeInstanceOf(RpcException);
    });

    it('wraps unexpected errors in RpcException', async () => {
      (mockNats.send as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));

      await expect(service.createTask(userId, dto)).rejects.toBeInstanceOf(RpcException);
    });
  });

  describe('updateTask', () => {
    it('updates filtered fields and appends notes', async () => {
      const task = { taskId: 't1', notes: [{ message: 'Old' }] } as any;
      (mockRepo.findOne as jest.Mock).mockResolvedValue(task);

      (mockRepo.update as jest.Mock).mockResolvedValue({});
      (mockRepo.findOne as jest.Mock).mockResolvedValueOnce({ taskId: 't1', notes: [{ message: 'Old' }, { message: 'New' }] });

      const result = await service.updateTask({ taskId: 't1', payload: { status: 'InProgress', notes: ['New'] } } as any);

      expect(mockRepo.update).toHaveBeenCalled();
      
    });

    it('throws an error when task not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.updateTask({ taskId: 'does-not-exist', payload: {} } as any)).rejects.toBeInstanceOf(RpcException);
    });
  });

  describe('getAllTasks', () => {
    it('returns pagination structure', async () => {
      (mockRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);
      const result = await service.getAllTasks(1, 10);
      expect(mockRepo.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
    });
  });

  describe('findPendingTasks', () => {
    it('returns null if user not found', async () => {
      (mockNats.send as jest.Mock).mockReturnValue(of(null));
      const result = await service.findPendingTasks('u1');
      expect(result).toBeNull();
    });

    it('filters out completed tasks', async () => {
      (mockNats.send as jest.Mock).mockReturnValue(of({ id: 'u1' }));
      (mockRepo.find as jest.Mock).mockResolvedValue([
        { taskId: 't1', status: 'InProgress', assignedTo: { id: 'u1' } },
        { taskId: 't2', status: 'Completed', assignedTo: { id: 'u1' } },
      ]);

      const result = await service.findPendingTasks('u1');
      expect(result).toEqual([{ taskId: 't1', status: 'InProgress', assignedTo: { id: 'u1' } }]);
    });
  });

  describe('getMyTasks', () => {
    it('returns null if user not found', async () => {
      (mockNats.send as jest.Mock).mockReturnValue(of(null));
      const result = await service.getMyTasks('u1');
      expect(result).toBeNull();
    });

    it('returns all tasks for user', async () => {
      (mockNats.send as jest.Mock).mockReturnValue(of({ id: 'u1' }));
      (mockRepo.find as jest.Mock).mockResolvedValue([{ taskId: 't1' }]);
      const result = await service.getMyTasks('u1');
      expect(result).toEqual([{ taskId: 't1' }]);
    });
  });
});



