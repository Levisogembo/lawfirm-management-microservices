import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User } from '../typeorm/entities/User';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { changedPasswordDto } from './Dtos/changePassword.dto';
import { RpcException } from '@nestjs/microservices';
import { of } from 'rxjs';

// Mock the bcrypt utility
jest.mock('../utils/bcrypt', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashedPassword123')
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let natsClient: ClientProxy;

  const mockUserRepository = {
    findOne: jest.fn(),
    update: jest.fn()
  };

  const mockNatsClient = {
    send: jest.fn()
  };

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'oldPassword',
    isVerified: false
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository
        },
        {
          provide: 'Nats_messenger',
          useValue: mockNatsClient
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    natsClient = module.get<ClientProxy>('Nats_messenger');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const changePasswordData: changedPasswordDto = {
        userId: '123',
        newPassword: 'newSecurePassword123'
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updatePassword(changePasswordData);

      expect(result).toEqual({ affected: 1 });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '123' } });
      expect(mockUserRepository.update).toHaveBeenCalledWith('123', { password: 'hashedPassword123' });
    });

    it('should return null when user is not found', async () => {
      const changePasswordData: changedPasswordDto = {
        userId: '999',
        newPassword: 'newSecurePassword123'
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.updatePassword(changePasswordData);

      expect(result).toBeNull();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '999' } });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should handle empty password', async () => {
      const changePasswordData: changedPasswordDto = {
        userId: '123',
        newPassword: ''
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updatePassword(changePasswordData);

      expect(result).toEqual({ affected: 1 });
      expect(mockUserRepository.update).toHaveBeenCalledWith('123', { password: 'hashedPassword123' });
    });

  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const userEmail = 'test@example.com';

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      mockNatsClient.send.mockReturnValue(of({ status: 'success' }));

      const result = await service.verifyEmail(userEmail);

      expect(result).toEqual({ msg: 'Email verified successfully' });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUserRepository.update).toHaveBeenCalledWith({ email: 'test@example.com' }, { isVerified: true });
      expect(mockNatsClient.send).toHaveBeenCalledWith({ cmd: 'sendVerifiedEmail' }, 'test@example.com');
    });

    it('should throw RpcException when user is not found', async () => {
      const userEmail = 'nonexistent@example.com';

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail(userEmail)).rejects.toThrow(new RpcException('User not found'));
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(mockNatsClient.send).not.toHaveBeenCalled();
    });

    it('should throw RpcException when email sending fails', async () => {
      const userEmail = 'test@example.com';

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      mockNatsClient.send.mockReturnValue(of({ status: 'failed' }));

      await expect(service.verifyEmail(userEmail)).rejects.toThrow(new RpcException('Failed to send email,try again'));
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUserRepository.update).toHaveBeenCalledWith({ email: 'test@example.com' }, { isVerified: true });
      expect(mockNatsClient.send).toHaveBeenCalledWith({ cmd: 'sendVerifiedEmail' }, 'test@example.com');
    });


    it('should handle NATS client errors', async () => {
      const userEmail = 'test@example.com';

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      mockNatsClient.send.mockReturnValue(of({ error: 'NATS connection failed' }));

      await expect(service.verifyEmail(userEmail)).rejects.toThrow(new RpcException('Failed to send email,try again'));
      expect(mockNatsClient.send).toHaveBeenCalledWith({ cmd: 'sendVerifiedEmail' }, 'test@example.com');
    });

  });

  describe('Integration Tests', () => {
    it('should handle complete password update flow', async () => {
      const changePasswordData: changedPasswordDto = {
        userId: '123',
        newPassword: 'newSecurePassword123'
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updatePassword(changePasswordData);

      expect(result).toEqual({ affected: 1 });
      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should handle complete email verification flow', async () => {
      const userEmail = 'test@example.com';

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      mockNatsClient.send.mockReturnValue(of({ status: 'success' }));

      const result = await service.verifyEmail(userEmail);

      expect(result).toEqual({ msg: 'Email verified successfully' });
      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
      expect(mockNatsClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user ID in updatePassword', async () => {
      const changePasswordData = {
        userId: null,
        newPassword: 'password123'
      } as any;

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.updatePassword(changePasswordData);

      expect(result).toBeNull();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: null } });
    });

    it('should handle undefined email in verifyEmail', async () => {
      const userEmail = undefined as any;

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail(userEmail)).rejects.toThrow(new RpcException('User not found'));
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: undefined } });
    });

    it('should handle concurrent password updates', async () => {
      const changePasswordData1: changedPasswordDto = {
        userId: '123',
        newPassword: 'password1'
      };
      const changePasswordData2: changedPasswordDto = {
        userId: '123',
        newPassword: 'password2'
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const [result1, result2] = await Promise.all([
        service.updatePassword(changePasswordData1),
        service.updatePassword(changePasswordData2)
      ]);

      expect(result1).toEqual({ affected: 1 });
      expect(result2).toEqual({ affected: 1 });
      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.update).toHaveBeenCalledTimes(2);
    });
  });
});
