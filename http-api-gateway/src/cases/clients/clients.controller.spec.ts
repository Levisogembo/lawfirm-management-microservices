 import { Test, TestingModule } from '@nestjs/testing';
 import { ClientsController } from './clients.controller';
 import { ClientProxy } from '@nestjs/microservices';
 import { of } from 'rxjs';

 describe('ClientsController', () => {
   let controller: ClientsController;
   let natsClient: { send: jest.Mock };

   beforeEach(async () => {
     natsClient = { send: jest.fn() };

     const module: TestingModule = await Test.createTestingModule({
       controllers: [ClientsController],
       providers: [
         { provide: 'Nats_messenger', useValue: natsClient as unknown as ClientProxy },
       ],
     }).compile();

     controller = module.get<ClientsController>(ClientsController);
   });

   it('should be defined', () => {
     expect(controller).toBeDefined();
   });

   describe('createNewClient', () => {
     it('should create client and return success message', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const clientDetails: any = { name: 'ACME' };
       const client = { id: 'c1', ...clientDetails };

       natsClient.send.mockReturnValue(of(client));

       const res = await controller.createNewClient(req, clientDetails);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'clientDetails' },
         { userToken: req.user, clientDetails },
       );
       expect(res).toEqual({ msg: 'Client created successfully', client });
     });
   });

   describe('getAllClient', () => {
     it('should return success when data has items', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const allClients = { data: [{ id: 'c1' }] };
       natsClient.send.mockReturnValue(of(allClients));

       const res = await controller.getAllClient(req, 1, 10);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'getAllClients' },
         { userToken: req.user, page: 1, limit: 10 },
       );
       expect(res).toEqual({ msg: 'success', allClients });
     });

     it('should return message when empty', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const allClients = { data: [] };
       natsClient.send.mockReturnValue(of(allClients));

       const res = await controller.getAllClient(req, 1, 10);
       expect(res).toEqual({ msg: 'no clients at the moment' });
     });
   });

   describe('searchClientById', () => {
     it('should return success and foundClient', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const id = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';
       const foundClient = { id, name: 'ACME' };
       natsClient.send.mockReturnValue(of(foundClient));

       const res = await controller.searchClientById(req, id);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'getClientById' },
         { userToken: req.user, id },
       );
       expect(res).toEqual({ msg: 'success', foundClient });
     });
   });

   describe('updateClient', () => {
     it('should update and return message with updatedClient', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const id = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';
       const clientDetails: any = { name: 'New Name' };
       const updatedClient = { id, ...clientDetails };
       natsClient.send.mockReturnValue(of(updatedClient));

       const res = await controller.updateClient(req, clientDetails, id);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'updatedClientDetails' },
         { userToken: req.user, clientDetails, id },
       );
       expect(res).toEqual({ msg: 'Client updated successfully', updatedClient });
     });
   });

   describe('deleteClient', () => {
     it('should delete and return success message', async () => {
       const req: any = { user: { sub: 'user-id' } };
       const id = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';
       natsClient.send.mockReturnValue(of({ acknowledged: true, deletedCount: 1 }));

       const res = await controller.deleteClient(req, id);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'deleteClient' },
         { userToken: req.user, id },
       );
       expect(res).toEqual({ msg: 'Client Deleted successfully' });
     });
   });
 });
