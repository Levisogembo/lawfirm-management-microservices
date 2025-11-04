import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { ConflictException, HttpException } from '@nestjs/common';

describe('RolesController (unit)', () => {
    let controller: RolesController;
    let natsClient: jest.Mocked<ClientProxy>;

    beforeEach(async () => {
        const natsMock: jest.Mocked<ClientProxy> = {
            send: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [RolesController],
            providers: [{ provide: 'Nats_messenger', useValue: natsMock }],
        }).compile();

        controller = module.get<RolesController>(RolesController);
        natsClient = module.get('Nats_messenger');
    });

    describe('createRole', () => {
        it('should create role successfully', async () => {
            (natsClient.send as any).mockReturnValueOnce(of({ id: 'r1', role: 'Admin' }));
            const req: any = { user: { id: 'admin' } };
            const result = await controller.createRole(req, { role: 'Admin' } as any);
            expect(result).toEqual({ id: 'r1', role: 'Admin' });
        });

        it('should forward errors from service', async () => {
            (natsClient.send as any).mockReturnValueOnce(throwError(() => new ConflictException('Role exists')));
            const req: any = { user: { id: 'admin' } };
            await expect(controller.createRole(req, { role: 'Admin' } as any)).rejects.toBeInstanceOf(ConflictException);
        });
    });

    describe('getAllRoles', () => {
        it('should return roles when present', async () => {
            (natsClient.send as any).mockReturnValueOnce(of([{ id: 'r1', role: 'Admin' }]));
            const result = await controller.getAllRoles();
            expect(result).toEqual([{ id: 'r1', role: 'Admin' }]);
        });

        it('should throw 404 when no roles', async () => {
            (natsClient.send as any).mockReturnValueOnce(of(null));
            await expect(controller.getAllRoles()).rejects.toBeInstanceOf(HttpException);
        });
    });

    describe('delete role', () => {
        it('should delegate delete and return result', async () => {
            (natsClient.send as any).mockReturnValueOnce(of({ affected: 1 }));
            const req: any = { user: { id: 'admin' } };
            const result = await controller.deleteRole(req, '3d6f0a10-64b3-4a30-9e1f-0d9e9f1b4b10');
            expect(natsClient.send).toHaveBeenCalled();
            expect(result).toBeInstanceOf(Object)
        });
    });
});


