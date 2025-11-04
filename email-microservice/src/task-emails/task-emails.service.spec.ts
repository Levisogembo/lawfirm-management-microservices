import { Test, TestingModule } from '@nestjs/testing';
import { TaskEmailsService } from './task-emails.service';

describe('TaskEmailsService', () => {
  let service: TaskEmailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskEmailsService],
    }).compile();

    service = module.get<TaskEmailsService>(TaskEmailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
