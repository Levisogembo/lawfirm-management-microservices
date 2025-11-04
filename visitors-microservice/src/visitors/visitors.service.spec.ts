import { Test, TestingModule } from '@nestjs/testing';
import { VisitorsService } from './visitors.service';
import { Repository, ILike } from 'typeorm';
import { Visitors } from '../typeorm/entities/Visitors';
import { getRepositoryToken } from '@nestjs/typeorm';

//mock repo
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn()
}

const mockVisitors = [
  {
    id: 1,
    fullName: "John Bar",
    phoneNumber: "073828291",
    purposeOfVisit: "Consultation",
    whoToSee: "Lawyer",
    timeIn: new Date(),
  },
  {
    id: 12,
    fullName: "Mary Nau",
    phoneNumber: "071828291",
    purposeOfVisit: "Consultation",
    whoToSee: "Admin",
    timeIn: new Date(),
  },
  {
    id: 13,
    fullName: "Michael Koome",
    phoneNumber: "075823564",
    purposeOfVisit: "Consultation",
    whoToSee: "Admin",
    timeIn: new Date(),
  },
];

describe('VisitorsService', () => {
  let service: VisitorsService;
  let repository: Repository<Visitors>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VisitorsService,{
        provide: getRepositoryToken(Visitors),
        useValue: mockRepository
      }],
      
    }).compile();

    service = module.get<VisitorsService>(VisitorsService);
    repository = module.get<Repository<Visitors>>(getRepositoryToken(Visitors))
  });

  afterEach(()=>{
    jest.clearAllMocks()
  })

  it('should return paginated visitors', async () => {
    // Arrange 
    (repository.findAndCount as jest.Mock).mockResolvedValue([mockVisitors, mockVisitors.length]);
    // Act
    const result = await service.getAllVisitors(1, 3);
    // Assert
    expect(result).toEqual({
      data: mockVisitors,
      total: mockVisitors.length,
      page: 1,
      limit: 3,
      totalPages: 1,
    });
  
    expect(repository.findAndCount).toHaveBeenCalledWith({
      skip: 0,
      take: 3,
      order: { timeIn: 'DESC' },
    });
  });

  it('should search visitor by name', async()=>{
      (repository.find as jest.Mock).mockResolvedValue(mockVisitors)
      const result = await service.searchVisitor("Michael")
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(repository.find).toHaveBeenCalledWith({
        where: { fullName: expect.any(Object) },
        order: { timeIn: 'DESC' },
      })
  })


  
  
});
