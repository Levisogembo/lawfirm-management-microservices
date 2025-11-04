import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService (unit)', () => {
    let service: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UsersService],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should be an instance of UsersService', () => {
        expect(service).toBeInstanceOf(UsersService);
    });

    it('should have no own enumerable properties (no public fields)', () => {
        expect(Object.keys(service)).toEqual([]);
    });

    it('should resolve the same instance from the testing module', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UsersService],
        }).compile();
        const a = module.get<UsersService>(UsersService);
        const b = module.get<UsersService>(UsersService);
        expect(a).toBe(b);
    });
});


