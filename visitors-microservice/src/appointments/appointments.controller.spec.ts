import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { RpcException } from '@nestjs/microservices';

const mockService = {
  createAppointment: jest.fn(),
  getAllAppointments: jest.fn(),
  getAppointmentById: jest.fn(),
  deleteAppointment: jest.fn()
}

const mockCreatedAppointment = {
  id: 1,
  title: "Appointment with county chief",
  location: "County Hall",
  startTime: new Date("2025-10-20 20:33:26"),
  endTime: new Date("2025-10-21 20:34:24"),
  client: "aa0087c9-6357-4673-9195-c68252e8ff1c",
  case: "09b4b33a-2471-481d-a9db-d9db90e77f40"
}

const savedAppointments = [
  {
    id: 1,
    title: "Appointment with county chief",
    location: "County Hall",
    startTime: new Date("2025-10-20 20:33:26"),
    endTime: new Date("2025-10-21 20:34:24"),
    client: "aa0087c9-6357-4673-9195-c68252e8ff1c",
    case: "09b4b33a-2471-481d-a9db-d9db90e77f40"
  },
  {
    id: 2,
    title: "Appointment with potential client",
    location: "Virtual",
    startTime: new Date("2025-10-22 20:33:26"),
    endTime: new Date("2025-10-23 20:34:24"),
    client: "aa0087c9-6357-4673-9195-c68252e8ff1c",
    case: "09b4b33a-2471-481d-a9db-d9db90e77f40"
  }
]

const mockPayload = {
  title: "Appointment with county chief",
  location: "County Hall",
  startTime: new Date("2025-10-20 20:33:26"),
  endTime: new Date("2025-10-21 20:34:24"),
  client: "aa0087c9-6357-4673-9195-c68252e8ff1c",
  case: "09b4b33a-2471-481d-a9db-d9db90e77f40"
}

const fakeUserToken = {
  "id": "1",
  "username": "john",
  "role": "Admin",
  "isVerified": true,
  "iat": "1759494506",
  "exp": "1759498106"
}

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: AppointmentsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [{
        provide: AppointmentsService,
        useValue: mockService
      }]
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService)
  });

  it('should be create new appointment', async () => {
    //mock out the service
    (service.createAppointment as jest.Mock).mockResolvedValue(mockCreatedAppointment)

    const result = await controller.createAppointment({userToken:fakeUserToken,appointmentDetails:mockPayload})
    expect(result).toEqual(mockCreatedAppointment)
    expect(result).toBeInstanceOf(Object)
    expect(controller).toBeDefined();
  });

  it('should return appointments found', async ()=>{
      (service.getAllAppointments as jest.Mock).mockResolvedValue({
        data: savedAppointments,
        total: savedAppointments.length,
        page: 1,
        limit: 4
      })

      const result = await controller.getAllAppointment({userToken:fakeUserToken,page:1,limit:4})
      expect(result.data).toEqual(savedAppointments)
      expect(result.total).toBe(savedAppointments.length)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(4)
      expect(service.getAllAppointments).toHaveBeenCalledWith(1,4)
  })

  it('should get appointment by id', async()=>{
    (service.getAppointmentById as jest.Mock).mockResolvedValue({id:'1',title:'Emergency appointment',location:'office'})
    const result = await controller.getAppointmentById({userToken:fakeUserToken,appointmentId:'1'})
    expect(result).toEqual({id:'1',title:'Emergency appointment',location:'office'})
    expect(service.getAppointmentById).toHaveBeenCalledWith('1')
    expect(result).toBeTruthy()
  })

  it('should throw a not found error for appointment not found',async()=>{
      (service.getAppointmentById as jest.Mock).mockRejectedValue(new RpcException("Appointment not found"))
      //const result = await controller.getAppointmentById({userToken:fakeUserToken,appointmentId:'1234'})
      await expect(
        controller.getAppointmentById({userToken:fakeUserToken,appointmentId:'1234'})
      ).rejects.toThrow('Appointment not found')
  })

  it('should delete appointments by id', async ()=>{
    (service.deleteAppointment as jest.Mock).mockResolvedValue({affected:1})
    const result = await controller.deleteAppointment({userToken:fakeUserToken,appointmentId:'1'})
    expect(result).toEqual({affected:1})
    expect(service.getAppointmentById).toHaveBeenCalledWith('1')
  })
});
