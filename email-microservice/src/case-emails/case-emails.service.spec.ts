import { Test, TestingModule } from '@nestjs/testing';
import { CaseEmailsService } from './case-emails.service';

describe('CaseEmailsService', () => {
  let service: CaseEmailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaseEmailsService],
    }).compile();

    service = module.get<CaseEmailsService>(CaseEmailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
