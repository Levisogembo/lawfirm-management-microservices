import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { of } from 'rxjs';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('AuthService (unit)', () => {
    let service: AuthService;
    let natsClient: jest.Mocked<ClientProxy>;
    let jwtService: jest.Mocked<JwtService>;

    beforeEach(async () => {
        natsClient = { send: jest.fn() } as any;
        jwtService = { signAsync: jest.fn() } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: 'Nats_messenger', useValue: natsClient },
                { provide: JwtService, useValue: jwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    describe('validateUser', () => {
        it('should throw NotFound when user missing', async () => {
            (natsClient.send as any).mockReturnValueOnce(of(null));
            await expect(service.validateUser('john', 'x')).rejects.toBeInstanceOf(NotFoundException);
        });

    });
});


