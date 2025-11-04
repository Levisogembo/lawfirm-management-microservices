import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
    let controller: FilesController;
    let service: jest.Mocked<FilesService>;

    beforeEach(async () => {
        const serviceMock: jest.Mocked<FilesService> = {
            uploadNewFile: jest.fn(),
            getAllFiles: jest.fn(),
            getFileById: jest.fn(),
            searchFileCriteria: jest.fn(),
            updateFileMetadata: jest.fn(),
            deleteLocalFile: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [FilesController],
            providers: [{ provide: FilesService, useValue: serviceMock }],
        }).compile();

        controller = module.get<FilesController>(FilesController);
        service = module.get(FilesService) as jest.Mocked<FilesService>;
    });

    describe('uploadFile', () => {
        it('should delegate to service.uploadNewFile', async () => {
            service.uploadNewFile.mockResolvedValueOnce({ fileId: 'f1' } as any);
            const payload = { userToken: { id: 'u1' }, fileMetadata: { fileName: 'a' } } as any;
            const result = await controller.uploadFile(payload);
            expect(service.uploadNewFile).toHaveBeenCalledWith(payload);
            expect(result).toEqual({ fileId: 'f1' });
        });
    });

    describe('getAllFiles', () => {
        it('should delegate to service.getAllFiles', async () => {
            service.getAllFiles.mockResolvedValueOnce({ total: 1, page: 1, limit: 10, data: [] } as any);
            const payload = { page: 1, limit: 10 } as any;
            const result = await controller.getAllFiles(payload);
            expect(service.getAllFiles).toHaveBeenCalledWith(1, 10);
            expect(result).toEqual({ total: 1, page: 1, limit: 10, data: [] });
        });
    });

    describe('getFileByID', () => {
        it('should delegate to service.getFileById', async () => {
            service.getFileById.mockResolvedValueOnce({ fileId: 'f1' } as any);
            const payload = { fileId: 'f1' } as any;
            const result = await controller.getFileByID(payload);
            expect(service.getFileById).toHaveBeenCalledWith('f1');
            expect(result).toEqual({ fileId: 'f1' });
        });
    });

    describe('searchFiles', () => {
        it('should delegate to service.searchFileCriteria', async () => {
            service.searchFileCriteria.mockResolvedValueOnce([{ id: 1 }] as any);
            const payload = { searchCriteria: { filename: 'a' } } as any;
            const result = await controller.searchFiles(payload);
            expect(service.searchFileCriteria).toHaveBeenCalledWith({ filename: 'a' });
            expect(result).toEqual([{ id: 1 }]);
        });
    });

    describe('updateFile', () => {
        it('should delegate to service.updateFileMetadata', async () => {
            service.updateFileMetadata.mockResolvedValueOnce({ fileId: 'f1' } as any);
            const payload = { userToken: { id: 'u1' }, id: 'f1', fileMetadata: { fileName: 'x' } } as any;
            const result = await controller.updateFile(payload);
            expect(service.updateFileMetadata).toHaveBeenCalledWith({ id: 'u1' }, 'f1', { fileName: 'x' });
            expect(result).toEqual({ fileId: 'f1' });
        });
    });

    describe('deleteLocalFile', () => {
        it('should delegate to service.deleteLocalFile', async () => {
            service.deleteLocalFile.mockResolvedValueOnce({ msg: 'File deleted successfully' } as any);
            const payload = { fileId: 'f1' } as any;
            const result = await controller.deleteLocalFile(payload);
            expect(service.deleteLocalFile).toHaveBeenCalledWith('f1');
            expect(result).toEqual({ msg: 'File deleted successfully' });
        });
    });
});


