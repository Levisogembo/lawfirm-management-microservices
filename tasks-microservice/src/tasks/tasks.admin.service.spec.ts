import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { adminTaskService } from './tasks.admin.service';
import { Tasks } from '../typeorm/entities/Tasks';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

describe('adminTaskService', () => {
  let service: adminTaskService;

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockNats: Partial<ClientProxy> = {
    send: jest.fn(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        adminTaskService,
        { provide: getRepositoryToken(Tasks), useValue: mockRepo },
        { provide: 'Nats_messenger', useValue: mockNats },
      ],
    }).compile();

    service = module.get<adminTaskService>(adminTaskService);
    jest.clearAllMocks();
  });

  const adminId = 'admin-1';
  const payload: any = {
    assignedTo: 'user-1',
    name: 'Task X',
    description: 'Do X',
    notes: ['n1', { message: 'n2' }],
    priority: 'High',
  };

  it('assigns a task and emits notification', async () => {
    (mockNats.send as jest.Mock)
      .mockReturnValueOnce(of({ id: 'user-1', email: 'user@example.com', username: 'jane' })) // found user
      .mockReturnValueOnce(of({ id: adminId, username: 'admin' })); // found admin

    (mockRepo.findOne as jest.Mock).mockResolvedValueOnce(null); // no duplicate name
    (mockRepo.create as jest.Mock).mockImplementation((obj) => ({ taskId: 't100', ...obj }));
    (mockRepo.save as jest.Mock).mockResolvedValue({ taskId: 't100', name: payload.name });
    (mockRepo.findOne as jest.Mock).mockResolvedValueOnce({ taskId: 't100', assignedTo: { username: 'jane' } });

    (mockNats.emit as jest.Mock).mockReturnValue({});

    const result = await service.assignTask(adminId, payload);

    expect(mockNats.send).toHaveBeenNthCalledWith(1, { cmd: 'getEmployeeById' }, payload.assignedTo);
    expect(mockNats.send).toHaveBeenNthCalledWith(2, { cmd: 'getEmployeeById' }, adminId);
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { name: payload.name } });
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockNats.emit).toHaveBeenCalledWith(
      { cmd: 'sendAssignedTaskNotification' },
      { to: 'user@example.com', assignedBy: 'admin', task: payload.name },
    );
    expect(result).toEqual({ taskId: 't100', assignedTo: { username: 'jane' } });
  });

  it('throws when assignee not found', async () => {
    (mockNats.send as jest.Mock).mockReturnValueOnce(of(null));
    await expect(service.assignTask(adminId, payload)).rejects.toBeInstanceOf(RpcException);
  });

  it('throws when admin not found', async () => {
    (mockNats.send as jest.Mock)
      .mockReturnValueOnce(of({ id: 'user-1' }))
      .mockReturnValueOnce(of(null));
    await expect(service.assignTask(adminId, payload)).rejects.toBeInstanceOf(RpcException);
  });

  it('throws when task name exists', async () => {
    (mockNats.send as jest.Mock)
      .mockReturnValueOnce(of({ id: 'user-1' }))
      .mockReturnValueOnce(of({ id: adminId }));
    (mockRepo.findOne as jest.Mock).mockResolvedValueOnce({ taskId: 'dup' });
    await expect(service.assignTask(adminId, payload)).rejects.toBeInstanceOf(RpcException);
  });

  it('wraps unexpected errors in RpcException', async () => {
    (mockNats.send as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));
    await expect(service.assignTask(adminId, payload)).rejects.toBeInstanceOf(RpcException);
  });
});


