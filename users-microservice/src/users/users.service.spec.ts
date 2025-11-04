import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from '../typeorm/entities/User';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Roles } from '../typeorm/entities/Roles';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { mock } from 'node:test';
import { of } from 'rxjs';

const mockUserRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn()
}

const mockRolesRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn()
}

const mockUser = {
    email: 'user@gmail.com',
    username: 'doe',
    fullname: "John doe",
    roleId: "2",
    phonenumber: "0712340595"
}

const mockRole = {
    id: '2',
    role: 'Admin'
}

const createdUsers = [{
    id: '1',
    ...mockUser
},
{
    id: '2',
    email: 'mark@gmail.com',
    username: 'Mark',
    fullname: "Mark doe",
    roleId: "1",
    phonenumber: "0712340596"
}
]

describe('UserService', () => {
    let service: UsersService;
    let userRepository: Repository<User>
    let rolesRepository: Repository<Roles>
    let jwtService: JwtService
    let natsClient: ClientProxy
    let configService: ConfigService

    const mockConfigService = {
        get: jest.fn().mockReturnValue('mock-value')
    }

    const mockJwtService = {
        signAsync: jest.fn().mockResolvedValue('mock-jwt-token')
    };

    const createMockNatsClient = () => ({
        send: jest.fn().mockReturnValue(of({ status: 'success' }))
    });

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: getRepositoryToken(Roles),
                    useValue: mockRolesRepository
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService
                },
                {
                    provide: 'Nats_messenger',
                    useValue: createMockNatsClient()
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService
                },
                UsersService
            ]
        }).compile();
        service = app.get<UsersService>(UsersService)
        userRepository = app.get<Repository<User>>(getRepositoryToken(User))
        rolesRepository = app.get<Repository<Roles>>(getRepositoryToken(Roles))
        jwtService = app.get<JwtService>(JwtService)
        natsClient = app.get<ClientProxy>('Nats_messenger')
        configService = app.get<ConfigService>(ConfigService)
    });

    it('should create new user', async () => {
        // Mock the findOne for role check
        (rolesRepository.findOne as jest.Mock).mockResolvedValue(mockRole);
        (userRepository.findOne as jest.Mock).mockResolvedValue(null);
        (userRepository.create as jest.Mock).mockReturnValue(mockUser);
        (userRepository.save as jest.Mock).mockResolvedValue(mockUser);
        (jwtService.signAsync as jest.Mock).mockResolvedValue('mock-token');
        (natsClient.send as jest.Mock).mockReturnValue(of({ status: 'success' }));

        const result = await service.createNewUser(mockUser);
        expect(result).toEqual(mockUser);
    });

    it('should return paginated users', async () => {
        (userRepository.findAndCount as jest.Mock).mockResolvedValue([createdUsers, createdUsers.length])
        const result = await service.findAllUsers(1, 10)
        expect(result).toEqual({
            users: createdUsers,
            total: createdUsers.length,
            page: 1,
            limit: 10,
            totalPages: Math.ceil(createdUsers.length / 10)
        })
        expect(userRepository.findAndCount).toHaveBeenCalledWith({
            order: {createdAt:'DESC'},
            skip: (1 - 1)* 10,
            take: 10
        })
    })

    it('should find user by email',async()=>{
        (userRepository.findOne as jest.Mock).mockResolvedValue({id:'1',...mockUser})
        const result = await service.findEmail('user@gmail.com')
        expect(result).toEqual({id:'1',...mockUser})
    })

    it('should throw an error when user is not found by email',async()=>{
        (userRepository.findOne as jest.Mock).mockRejectedValue(new RpcException("Email not found"))
        await expect(
            service.findEmail("user@gmail.com")
        ).rejects.toThrow("Email not found")
    } )

});
