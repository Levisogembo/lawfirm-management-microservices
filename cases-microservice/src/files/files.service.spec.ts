import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { of } from 'rxjs';
import { Repository } from 'typeorm';
import { FilesService } from './files.service';
import { Files } from '../typeorm/entities/Files';

describe('FilesService', () => {
    let service: FilesService;

    const repositoryMock: Partial<Record<keyof Repository<any>, jest.Mock>> & any = {
        findOne: jest.fn(),
        findAndCount: jest.fn(),
        find: jest.fn(),
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
                FilesService,
                { provide: getRepositoryToken(Files), useValue: repositoryMock },
                { provide: 'Nats_messenger', useValue: natsClientMock },
            ],
        }).compile();

        service = module.get<FilesService>(FilesService);
    });

    describe('uploadNewFile', () => {
        const userToken = { id: 'u1', username: 'john' } as any;
        const fileMetadata = { fileName: 'doc.pdf', clientId: 'c1', caseId: 'case1', filePath: '/tmp/doc.pdf' } as any;

        it('should throw if filename exists', async () => {
            repositoryMock.findOne.mockResolvedValueOnce({ fileId: 'f1' });
            await expect(service.uploadNewFile({ userToken, fileMetadata } as any)).rejects.toBeInstanceOf(RpcException);
        });

        it('should save file metadata when valid', async () => {
            // filename unique
            repositoryMock.findOne.mockResolvedValueOnce(null);

            // getClientById, searchCaseById
            (natsClientMock.send as any) = jest.fn()
                .mockReturnValueOnce(of({ clientId: 'c1', clientName: 'Acme' }))
                .mockReturnValueOnce(of({ caseID: 'case1', caseTitle: 'Case' }));

            const created = { fileId: 'f1' };
            repositoryMock.create.mockReturnValueOnce(created);
            repositoryMock.save.mockResolvedValueOnce({ fileId: 'f1' });

            const result = await service.uploadNewFile({ userToken, fileMetadata } as any);

            expect(repositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
                fileName: 'doc.pdf',
                filepath: '/tmp/doc.pdf',
                uploadedBy: 'john',
            }));
            expect(result).toEqual({ fileId: 'f1' });
        });
    });

    describe('getAllFiles', () => {
        it('should paginate files with relations', async () => {
            repositoryMock.findAndCount.mockResolvedValueOnce([[{ id: 1 }], 3]);
            const result = await service.getAllFiles(2, 2);
            expect(repositoryMock.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 2, take: 2 }));
            expect(result).toEqual({ total: 3, page: 2, limit: 2, data: [{ id: 1 }] });
        });
    });

    describe('getFileById', () => {
        it('should return file if found', async () => {
            repositoryMock.findOne.mockResolvedValueOnce({ fileId: 'f1' });
            const result = await service.getFileById('f1');
            expect(result).toEqual({ fileId: 'f1' });
        });

        it('should throw if not found', async () => {
            repositoryMock.findOne.mockResolvedValueOnce(null);
            await expect(service.getFileById('missing')).rejects.toBeInstanceOf(RpcException);
        });
    });

    describe('searchFileCriteria', () => {
        it('should build where filters and return results', async () => {
            const found = [{ id: 1 }];
            repositoryMock.find.mockResolvedValueOnce(found);
            const result = await service.searchFileCriteria({ client: 'Ac', caseNumber: 'C-', filename: 'doc' } as any);
            expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
            expect(result).toBe(found);
        });

        it('should throw when no files found', async () => {
            repositoryMock.find.mockResolvedValueOnce([]);
            await expect(service.searchFileCriteria({} as any)).rejects.toBeInstanceOf(RpcException);
        });
    });

    describe('updateFileMetadata', () => {
        const userToken = { id: 'u1', username: 'john' } as any;

        it('should throw when file does not exist', async () => {
            repositoryMock.findOne.mockResolvedValueOnce(null);
            await expect(service.updateFileMetadata(userToken, 'f1', {} as any)).rejects.toBeInstanceOf(RpcException);
        });

        it('should throw when filename already exists', async () => {
            repositoryMock.findOne
                .mockResolvedValueOnce({ fileId: 'f1' }) // exists check
                .mockResolvedValueOnce({ fileId: 'other' }); // filename check
            await expect(service.updateFileMetadata(userToken, 'f1', { fileName: 'dup.pdf' } as any)).rejects.toBeInstanceOf(RpcException);
        });

        it('should update with filtered fields and resolve case/client', async () => {
            repositoryMock.findOne
                .mockResolvedValueOnce({ fileId: 'f1' }) // exists
                .mockResolvedValueOnce(null); // filename unique

            (natsClientMock.send as any) = jest.fn()
                .mockReturnValueOnce(of({ caseID: 'case1' }))
                .mockReturnValueOnce(of({ clientId: 'c1' }));

            repositoryMock.update.mockResolvedValueOnce(undefined);
            jest.spyOn(service, 'getFileById').mockResolvedValueOnce({ fileId: 'f1', fileName: 'ok.pdf' } as any);

            const result = await service.updateFileMetadata(userToken, 'f1', { fileName: 'ok.pdf', Case: 'case1', Client: 'c1' } as any);

            expect(repositoryMock.update).toHaveBeenCalledWith(
                'f1',
                expect.objectContaining({ uploadedBy: 'john' }),
            );
            expect(result).toEqual({ fileId: 'f1', fileName: 'ok.pdf' });
        });
    });

    describe('deleteLocalFile', () => {
        it('should call getFileById then delete', async () => {
            jest.spyOn(service, 'getFileById').mockResolvedValueOnce({ fileId: 'f1' } as any);
            repositoryMock.delete.mockResolvedValueOnce({ affected: 1 });
            const result = await service.deleteLocalFile('f1');
            expect(repositoryMock.delete).toHaveBeenCalledWith('f1');
            expect(result).toEqual({ msg: 'File deleted successfully' });
        });
    });
});

