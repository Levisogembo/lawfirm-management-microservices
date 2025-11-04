import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { of } from 'rxjs';
import { Repository } from 'typeorm';
import { FilesS3ServiceService } from './files.s3.service.service';
import { Files } from '../../typeorm/entities/Files';

describe('FilesS3ServiceService', () => {
    let service: FilesS3ServiceService;

    const repositoryMock: Partial<Record<keyof Repository<any>, jest.Mock>> & any = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const natsClientMock = {
        send: jest.fn(),
    } as unknown as ClientProxy;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FilesS3ServiceService,
                { provide: getRepositoryToken(Files), useValue: repositoryMock },
                { provide: 'Nats_messenger', useValue: natsClientMock },
            ],
        }).compile();

        service = module.get<FilesS3ServiceService>(FilesS3ServiceService);
    });

    describe('checkFileEligibility', () => {
        const userToken = { id: 'u1', username: 'john' } as any;

        it('should throw if filename exists', async () => {
            repositoryMock.findOne.mockResolvedValueOnce({ fileId: 'f1' });
            await expect(service.checkFileEligibility(userToken, { fileName: 'dup.pdf' } as any))
                .rejects.toBeInstanceOf(RpcException);
        });

        it('should throw if client not found', async () => {
            repositoryMock.findOne.mockResolvedValueOnce(null);
            (natsClientMock.send as any) = jest.fn().mockReturnValueOnce(of(null));
            await expect(service.checkFileEligibility(userToken, { clientId: 'c1' } as any))
                .rejects.toBeInstanceOf(RpcException);
        });

        it('should throw if case not found', async () => {
            repositoryMock.findOne.mockResolvedValueOnce(null);
            (natsClientMock.send as any) = jest.fn()
                .mockReturnValueOnce(of({ clientId: 'c1', clientName: 'Acme' })) // client
                .mockReturnValueOnce(of(null)); // case
            await expect(service.checkFileEligibility(userToken, { clientId: 'c1', caseId: 'case1' } as any))
                .rejects.toBeInstanceOf(RpcException);
        });

        it('should return clientName when client provided and found', async () => {
            repositoryMock.findOne.mockResolvedValueOnce(null);
            (natsClientMock.send as any) = jest.fn()
                .mockReturnValueOnce(of({ clientId: 'c1', clientName: 'Acme' }))
                .mockReturnValueOnce(of({ caseID: 'case1' }));
            const result = await service.checkFileEligibility(userToken, { clientId: 'c1', caseId: 'case1' } as any);
            expect(result).toEqual({ clientName: 'Acme' });
        });

        it('should return message when no client provided', async () => {
            repositoryMock.findOne.mockResolvedValueOnce(null);
            (natsClientMock.send as any) = jest.fn().mockReturnValueOnce(of({ caseID: 'case1' }));
            const result = await service.checkFileEligibility(userToken, { caseId: 'case1' } as any);
            expect(result).toEqual({ msg: 'No client name found' });
        });
    });

    describe('uploadS3File', () => {
        const userToken = { id: 'u1', username: 'john' } as any;
        const payload = { clientId: 'c1', caseId: 'case1', s3FileUrl: 'u', s3Key: 'k', size: 10, fileName: 'a.pdf' } as any;

        it('should create and save file metadata', async () => {
            (natsClientMock.send as any) = jest.fn()
                .mockReturnValueOnce(of({ clientId: 'c1' }))
                .mockReturnValueOnce(of({ caseID: 'case1' }));
            const created = { fileId: 'f1' };
            repositoryMock.create.mockReturnValueOnce(created);
            repositoryMock.save.mockResolvedValueOnce({ fileId: 'f1' });
            const result = await service.uploadS3File(userToken, payload);
            expect(repositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({ uploadedBy: 'john', s3Key: 'k' }));
            expect(result).toEqual({ fileId: 'f1' });
        });
    });

    describe('deleteS3File', () => {
        it('should throw when not found', async () => {
            repositoryMock.findOne.mockResolvedValueOnce(null);
            await expect(service.deleteS3File('missing')).rejects.toMatchObject({message: 'File not found'})
        });

        
    });
});

