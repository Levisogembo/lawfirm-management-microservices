import { Test, TestingModule } from '@nestjs/testing';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { userTokenDto } from './Dtos/searchVisitor.dto';



describe('VisitorsController', () => {
  let controller: VisitorsController;
  let service: VisitorsService

  const mockVisitorsService = {
    getAllVisitors: jest.fn(),
    searchVisitor: jest.fn(),
    registerVisitor: jest.fn()
  }

  const mockResult = { data: ['John', 'Jane'], total: 2 };
  const mockVisitor = [{id:1,fullName:'Miriam Mario'},{id:2,fullName:'David Wasike'}]
  const fakeUserToken = {
    "id": "1",
    "username": "john",
    "role": "Admin",
    "isVerified": true,
    "iat": "1759494506",
    "exp": "1759498106"
  }
  const visitorDetails = {
    fullName: "Mark Muiru",
    phoneNumber: "0712345678",
    purposeOfVisit: "Meeting",
    whoToSee: "Manager",
    timeIn: new Date()
  }
  const mockRegistrationResponse = {id:1,...visitorDetails}
  const registrationDto = {userToken:fakeUserToken,visitorDetails}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisitorsController],
      providers: [{
        provide: VisitorsService,
        useValue: mockVisitorsService
      }]
    }).compile();

    controller = module.get<VisitorsController>(VisitorsController);
    service = module.get<VisitorsService>(VisitorsService)
  });

  afterEach(async()=>{
    jest.clearAllMocks()
  })

  it('should be call getvisitors method and return found visitors', async () => {
    (service.getAllVisitors as jest.Mock).mockResolvedValue(mockResult)

    //get result
    const result = await service.getAllVisitors(1,3)
    expect(controller).toBeDefined();
    expect(result).toEqual({
      data: ['John','Jane'],
      total:2
    })
    expect(result.data.length).toBeTruthy()
  });

  it('should return searched visitors', async()=>{
      (service.searchVisitor as jest.Mock).mockResolvedValue(mockVisitor) 
      const dto = {userToken: fakeUserToken , fullName: "Miriam" } //mock the dto expected by the controller
      const result = await controller.searchForVisitor(dto)
      expect(result).toBeInstanceOf(Array)
  })

  it('should register new visitor',async()=>{  
    (service.registerVisitor as jest.Mock).mockResolvedValue(mockRegistrationResponse)
    const result = await controller.registerVisitor(registrationDto)
    expect(result).toEqual(mockRegistrationResponse)
    expect(result).toBeInstanceOf(Object)
  })
});
