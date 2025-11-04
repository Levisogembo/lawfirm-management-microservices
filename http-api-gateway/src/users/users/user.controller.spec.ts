import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersController ', () => {
    let controller: UsersController;
    let natsClient: jest.Mocked<ClientProxy>;

    beforeEach(async () => {
        const natsMock: jest.Mocked<ClientProxy> = {
            send: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                { provide: 'Nats_messenger', useValue: natsMock },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        natsClient = module.get('Nats_messenger');
    });

    describe('createNewUser', () => {
        it('should create a new user and return sanitized payload', async () => {
            (natsClient.send as any).mockReturnValueOnce(of({ id: 'u1', username: 'john', password: 'secret' }));
            const req: any = { user: { id: 'admin' } };
            const result = await controller.createNewUser(req, { username: 'john', password: 'x', email: 'e@test.com' } as any);
            expect(natsClient.send).toHaveBeenCalledWith({ cmd: 'createUser' }, { userToken: { id: 'admin' }, userInfo: expect.any(Object) });
            expect(Array.isArray(result)).toBe(true);
            expect(result[0].msg).toBe('User Created Successfully');
            expect(result[0].user).toMatchObject({ id: 'u1', username: 'john' });
        });
    });

    describe('getUsers', () => {
        it('should return no users message when empty', async () => {
            (natsClient.send as any).mockReturnValueOnce(of({ users: [] }));
            const req: any = { user: { id: 'admin' } };
            const result = await controller.getUsers(req, 1, 10);
            expect(result).toEqual({ msg: 'No users found' });
        });

        it('should return mapped users when present', async () => {
            (natsClient.send as any).mockReturnValueOnce(of({ users: [{ id: 'u1', username: 'john', password: 'secret' }] }));
            const req: any = { user: { id: 'admin' } };
            const result = await controller.getUsers(req, 1, 10);
            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toMatchObject({ msg: 'success', total: 1, page: 1 });
            expect(result[0].data.length).toBe(1);
        });
    });

    describe('getByUserName', () => {
        it('should delegate to nats and return result', async () => {
            (natsClient.send as any).mockReturnValueOnce(of({ id: 'u1', username: 'john' }));
            const result = await controller.getByUserName('john');
            expect(natsClient.send).toHaveBeenCalledWith({ cmd: 'getByUsername' }, 'john');
            expect(result).toEqual({ id: 'u1', username: 'john' });
        });
    });

    describe('getById', () => {
        it('should return user when found', async () => {
            (natsClient.send as any).mockReturnValueOnce(of({ id: 'u1', username: 'john' }));
            const result = await controller.getById('3d6f0a10-64b3-4a30-9e1f-0d9e9f1b4b10');
            expect(result).toMatchObject({ msg: 'success', data: { id: 'u1', username: 'john' } });
        });

        it('should throw NotFoundException when missing', async () => {
            (natsClient.send as any).mockReturnValueOnce(of(null));
            await expect(controller.getById('3d6f0a10-64b3-4a30-9e1f-0d9e9f1b4b10')).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('updateProfile', () => {
        it('should return success with updated profile', async () => {
            (natsClient.send as any).mockReturnValueOnce(of({ id: 'u1', username: 'new' }));
            const req: any = { user: { id: 'u1' } };
            const result = await controller.updateProfile(req, { username: 'new' } as any);
            expect(natsClient.send).toHaveBeenCalledWith({ cmd: 'updateUserProfile' }, { userDetails: { id: 'u1' }, profileInfo: { username: 'new' } });
            expect(result).toMatchObject({ msg: 'success', data: { id: 'u1', username: 'new' } });
        });

        it('should map username conflict to ConflictException', async () => {
            (natsClient.send as any).mockReturnValueOnce(throwError(() => ({ message: 'username already exists try another one' })));
            const req: any = { user: { id: 'u1' } };
            await expect(controller.updateProfile(req, { username: 'taken' } as any)).rejects.toBeInstanceOf(ConflictException);
        });

        it('should map email conflict to ConflictException', async () => {
            (natsClient.send as any).mockReturnValueOnce(throwError(() => ({ message: 'email already exists try another one' })));
            const req: any = { user: { id: 'u1' } };
            await expect(controller.updateProfile(req, { email: 'taken@test.com' } as any)).rejects.toBeInstanceOf(ConflictException);
        });
    });

    describe('deleteUser', () => {
        it('should return success when deletion succeeds', async () => {
            (natsClient.send as any).mockReturnValueOnce(of({ affected: 1 }));
            const req: any = { user: { id: 'admin' } };
            const result = await controller.deleteUser(req, '3d6f0a10-64b3-4a30-9e1f-0d9e9f1b4b10');
            expect(natsClient.send).toHaveBeenCalledWith({ cmd: 'deleteUser' }, { userToken: { id: 'admin' }, userId: expect.any(String) });
            expect(result).toEqual({ msg: 'User Deleted Successfully' });
        });

        it('should throw NotFoundException when deletion returns null', async () => {
            (natsClient.send as any).mockReturnValueOnce(of(null));
            const req: any = { user: { id: 'admin' } };
            await expect(controller.deleteUser(req, '3d6f0a10-64b3-4a30-9e1f-0d9e9f1b4b10')).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});


