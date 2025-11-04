import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { changedPasswordDto } from './Dtos/changePassword.dto';
import { RpcException } from '@nestjs/microservices';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    updatePassword: jest.fn(),
    verifyEmail: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changePasswordData: changedPasswordDto = {
        userId: '123',
        newPassword: 'newSecurePassword123'
      };

      const mockUpdateResult = { affected: 1 };
      mockAuthService.updatePassword.mockResolvedValue(mockUpdateResult);

      const result = await controller.changePassword(changePasswordData);

      expect(result).toEqual(mockUpdateResult);
      expect(mockAuthService.updatePassword).toHaveBeenCalledWith(changePasswordData);
      expect(mockAuthService.updatePassword).toHaveBeenCalledTimes(1);
    });

    it('should return null when user is not found', async () => {
      const changePasswordData: changedPasswordDto = {
        userId: '999',
        newPassword: 'newSecurePassword123'
      };

      mockAuthService.updatePassword.mockResolvedValue(null);

      const result = await controller.changePassword(changePasswordData);

      expect(result).toBeNull();
      expect(mockAuthService.updatePassword).toHaveBeenCalledWith(changePasswordData);
    });

  
    it('should handle invalid user ID', async () => {
      const changePasswordData: changedPasswordDto = {
        userId: '',
        newPassword: 'newSecurePassword123'
      };

      mockAuthService.updatePassword.mockResolvedValue(null);

      const result = await controller.changePassword(changePasswordData);

      expect(result).toBeNull();
      expect(mockAuthService.updatePassword).toHaveBeenCalledWith(changePasswordData);
    });

  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const userEmail = 'test@example.com';
      const mockVerificationResult = { msg: 'Email verified successfully' };

      (mockAuthService.verifyEmail as jest.Mock).mockResolvedValue(mockVerificationResult);

      const result = await controller.verifyEmail(userEmail);

      expect(result).toEqual(mockVerificationResult);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(userEmail);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledTimes(1);
    });

    it('should throw RpcException when user is not found', async () => {
      const userEmail = 'nonexistent@example.com';

      (mockAuthService.verifyEmail as jest.Mock).mockRejectedValue(new RpcException('User not found'));

      await expect(controller.verifyEmail(userEmail)).rejects.toThrow(RpcException);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(userEmail);
    });

    it('should throw RpcException when email sending fails', async () => {
      const userEmail = 'test@example.com';

      mockAuthService.verifyEmail.mockRejectedValue(new RpcException('Failed to send email,try again'));

      await expect(controller.verifyEmail(userEmail)).rejects.toThrow(RpcException);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(userEmail);
    });

    it('should handle empty email', async () => {
      const userEmail = '';

      mockAuthService.verifyEmail.mockRejectedValue(new RpcException('User not found'));

      await expect(controller.verifyEmail(userEmail)).rejects.toThrow(RpcException);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(userEmail);
    });

  });

});
