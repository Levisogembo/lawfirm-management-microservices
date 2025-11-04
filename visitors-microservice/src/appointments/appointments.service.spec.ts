import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { Appointments } from '../typeorm/entities/Appointments';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { title } from 'process';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

const mockRepository = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn()
}

const mockCreatedAppointment = {
  title: "Appointment with county chief",
  location: "County Hall",
  startTime: new Date("2025-10-20 20:33:26"),
  endTime: new Date("2025-10-21 20:34:24"),
  client:"aa0087c9-6357-4673-9195-c68252e8ff1c",
  case:"09b4b33a-2471-481d-a9db-d9db90e77f40"
}

const fakeUserToken = {
  "id": "1",
  "username": "john",
  "role": "Admin",
  "isVerified": true,
  "iat": "1759494506",
  "exp": "1759498106"
}

const createdAppointment = {
  id:"3",
  ...mockCreatedAppointment
}

const mockAppointments = [
  {
    id: "1",
    title: "Appointment with litigation client",
    location: "City hall"
  },
  {
    id: "2",
    title: "Appointment with senior attorney James",
    location: "Milimani High courts"
  }
]

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let repository: Repository<Appointments>
  let natsClient: ClientProxy

  const mockNatsClient = {
    send: jest.fn(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointments),
          useValue: mockRepository
        },
        {
          provide: 'Nats_messenger',
          useValue: mockNatsClient
        }
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    repository = module.get<Repository<Appointments>>(getRepositoryToken(Appointments))
    natsClient = module.get<ClientProxy>('Nats_messenger')
  });

  it('should be find all appointments', async () => {
    (repository.findAndCount as jest.Mock).mockResolvedValue([mockAppointments, mockAppointments.length])
    const appointments = await service.getAllAppointments(1, 2)
    expect(appointments).toEqual(expect.objectContaining({ data: mockAppointments, limit: 2 }))//to do a partial match
    expect(repository.findAndCount).toHaveBeenCalledWith({
      relations: ['client', 'case', 'assignedTo'],
      select: {
        case: { caseID: true, caseNumber: true, caseTitle: true },
        client: { clientId: true, clientName: true },
        assignedTo: { id: true, username: true }
      }, order: { startTime: 'DESC' },
      skip: 0,
      take: 2
    })
    expect(service).toBeDefined();
  })

  it('should find one appointment', async () => {
    (repository.findOne as jest.Mock).mockResolvedValue({ id: "1" }).mockResolvedValue({
      id: "1",
      title: "Appointment with litigation client",
      location: "City hall"
    })
    const foundAppointment = await service.getAppointmentById("1")
    expect(foundAppointment).toEqual({
      id: "1",
      title: "Appointment with litigation client",
      location: "City hall"
    })
  })
});
