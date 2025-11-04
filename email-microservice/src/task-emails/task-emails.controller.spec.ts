import { Test, TestingModule } from '@nestjs/testing';
import { TaskEmailsController } from './task-emails.controller';

describe('TaskEmailsController', () => {
  let controller: TaskEmailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskEmailsController],
    }).compile();

    controller = module.get<TaskEmailsController>(TaskEmailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
