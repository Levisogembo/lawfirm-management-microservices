import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, NotFoundException, HttpException } from '@nestjs/common';

describe('AuthController (unit)', () => {
    let controller: AuthController;
    let natsClient: jest.Mocked<ClientProxy>;
    let jwtService: Partial<JwtService>;
    let configService: Partial<ConfigService>;

    beforeEach(async () => {
        natsClient = { send: jest.fn() } as any;
        jwtService = { signAsync: jest.fn() } as any;
        configService = { get: jest.fn() } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: 'Nats_messenger', useValue: natsClient },
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    describe('login', () => {
        it('should return token from request user', () => {
            const req: any = { user: 'jwt-token' };
            const result = controller.login(req);
            expect(result).toEqual({ msg: 'Login success', token: 'jwt-token' });
        });
    });

   
});


