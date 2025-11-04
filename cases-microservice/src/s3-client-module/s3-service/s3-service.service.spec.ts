import { Test, TestingModule } from '@nestjs/testing';
import { S3ServiceService } from './s3-service.service';

describe('S3ServiceService', () => {
  let service: S3ServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [S3ServiceService],
    }).compile();

    service = module.get<S3ServiceService>(S3ServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
