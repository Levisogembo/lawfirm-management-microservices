import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let natsClient: { send: jest.Mock };

  beforeEach(async () => {
    natsClient = { send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        { provide: 'Nats_messenger', useValue: natsClient as unknown as ClientProxy },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAppointment', () => {
    it('should create and return success message', async () => {
      const req: any = { user: { sub: 'user-id' } };
      const appointmentDetails: any = { title: 'Meet', time: '10:00' };
      const createdAppointment = { id: 'a1', ...appointmentDetails };

      natsClient.send.mockReturnValue(of(createdAppointment));

      const res = await controller.createAppointment(req, appointmentDetails);
      expect(natsClient.send).toHaveBeenCalledWith(
        { cmd: 'createNewAppointment' },
        { userToken: req.user, appointmentDetails },
      );
      expect(res).toEqual({ msg: 'Appointment created successfully', createdAppointment });
    });
  });

  describe('getAllAppointments', () => {
    it('should return success with data when non-empty', async () => {
      const req: any = { user: { sub: 'user-id' } };
      const AllAppointments = { data: [{ id: 'a1' }] };
      natsClient.send.mockReturnValue(of(AllAppointments));

      const res = await controller.getAllAppointments(req, 1, 10);
      expect(natsClient.send).toHaveBeenCalledWith(
        { cmd: 'fetchAllAppointments' },
        { userToken: req.user, page: 1, limit: 10 },
      );
      expect(res).toEqual({ msg: 'success', AllAppointments });
    });

    it('should return message when no appointments', async () => {
      const req: any = { user: { sub: 'user-id' } };
      natsClient.send.mockReturnValue(of({ data: [] }));

      const res = await controller.getAllAppointments(req, 1, 10);
      expect(res).toEqual({ msg: 'No appointments at the moment' });
    });
  });

  describe('searchByTitle', () => {
    it('should return hits when found', async () => {
      const req: any = { user: { sub: 'user-id' } };
      const title = 'Meet';
      const foundTitle = [{ id: 'a1' }, { id: 'a2' }];
      natsClient.send.mockReturnValue(of(foundTitle));

      const res = await controller.searchByTitle(req, title);
      expect(natsClient.send).toHaveBeenCalledWith(
        { cmd: 'searchAppointmentTitles' },
        { userToken: req.user, title },
      );
      expect(res).toEqual({ msg: 'success', hits: foundTitle.length, foundTitle });
    });

    it('should return message when none found', async () => {
      const req: any = { user: { sub: 'user-id' } };
      natsClient.send.mockReturnValue(of([]));
      const res = await controller.searchByTitle(req, 'x');
      expect(res).toEqual({ msg: 'No appointments found' });
    });
  });

  describe('getAppointmentById', () => {
    it('should return success and foundAppointment', async () => {
      const req: any = { user: { sub: 'user-id' } };
      const appointmentId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';
      const foundAppointment = { id: appointmentId };
      natsClient.send.mockReturnValue(of(foundAppointment));

      const res = await controller.getAppointmentById(req, appointmentId);
      expect(natsClient.send).toHaveBeenCalledWith(
        { cmd: 'searchAppointmentId' },
        { userToken: req.user, appointmentId },
      );
      expect(res).toEqual({ msg: 'success', foundAppointment });
    });
  });

  describe('updateAppointment', () => {
    it('should update and return success message', async () => {
      const req: any = { user: { sub: 'user-id' } };
      const appointmentId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';
      const appointmentDetails: any = { title: 'Updated' };
      const updatedAppointment = { id: appointmentId, ...appointmentDetails };
      natsClient.send.mockReturnValue(of(updatedAppointment));

      const res = await controller.updateAppointment(req, appointmentId, appointmentDetails);
      expect(natsClient.send).toHaveBeenCalledWith(
        { cmd: 'updateAppointmentDetails' },
        { userToken: req.user, appointmentId, appointmentDetails },
      );
      expect(res).toEqual({ msg: 'Appointment updated successfully', updatedAppointment });
    });
  });

  describe('deleteAppointment', () => {
    it('should delete and return success message', async () => {
      const req: any = { user: { sub: 'user-id' } };
      const appointmentId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';
      natsClient.send.mockReturnValue(of({ acknowledged: true }));

      const res = await controller.deleteAppointment(req, appointmentId);
      expect(natsClient.send).toHaveBeenCalledWith(
        { cmd: 'removeAppointment' },
        { userToken: req.user, appointmentId },
      );
      expect(res).toEqual({ msg: 'Appointment deleted successfully' });
    });
  });
});
