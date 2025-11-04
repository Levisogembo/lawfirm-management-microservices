import { Test, TestingModule } from '@nestjs/testing';
import { CaseEmailsController } from './case-emails.controller';

describe('CaseEmailsController', () => {
  let controller: CaseEmailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaseEmailsController],
    }).compile();

    controller = module.get<CaseEmailsController>(CaseEmailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
