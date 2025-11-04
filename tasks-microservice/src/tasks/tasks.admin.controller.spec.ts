import { Test, TestingModule } from '@nestjs/testing';
import { adminTasksController } from './tasks.admin.controller';
import { adminTaskService } from './tasks.admin.service';

const fakeAdminToken = {
  id: 'admin-1',
  username: 'alice',
  role: 'Admin',
  isVerified: true,
  iat: '1759494506',
  exp: '1759498106',
};

const mockAdminTasksService = {
  assignTask: jest.fn(),
};

describe('adminTasksController', () => {
  let controller: adminTasksController;
  let service: typeof mockAdminTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [adminTasksController],
      providers: [
        { provide: adminTaskService, useValue: mockAdminTasksService },
      ],
    }).compile();

    controller = module.get<adminTasksController>(adminTasksController);
    service = module.get<adminTaskService>(adminTaskService) as any;
    jest.clearAllMocks();
  });

  it('assignTasks should pass admin id and task details to service', async () => {
    const taskDetails = { name: 'Review Case', description: 'Review documents', assigneeId: 'user-2' } as any;
    (service.assignTask as jest.Mock).mockResolvedValue({ taskId: 't-admin-1' });

    const result = await controller.assignTasks({ userToken: fakeAdminToken, taskDetails } as any);

    expect(service.assignTask).toHaveBeenCalledWith(fakeAdminToken.id, taskDetails);
    expect(result).toEqual({ taskId: 't-admin-1' });
  });
});


