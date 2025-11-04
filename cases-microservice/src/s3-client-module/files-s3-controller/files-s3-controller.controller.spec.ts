import { Test, TestingModule } from '@nestjs/testing';
import { FilesS3ControllerController } from './files-s3-controller.controller';
import { FilesS3ServiceService } from '../files-s3-service/files.s3.service.service';

describe('FilesS3ControllerController', () => {
    let controller: FilesS3ControllerController;
    let service: jest.Mocked<FilesS3ServiceService>;

    beforeEach(async () => {
        const serviceMock: jest.Mocked<FilesS3ServiceService> = {
            checkFileEligibility: jest.fn(),
            uploadS3File: jest.fn(),
            updateS3File: jest.fn(),
            deleteS3File: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [FilesS3ControllerController],
            providers: [{ provide: FilesS3ServiceService, useValue: serviceMock }],
        }).compile();

        controller = module.get<FilesS3ControllerController>(FilesS3ControllerController);
        service = module.get(FilesS3ServiceService) as jest.Mocked<FilesS3ServiceService>;
    });

    describe('checkFileEligibility', () => {
        it('should delegate to service.checkFileEligibility', async () => {
            service.checkFileEligibility.mockResolvedValueOnce({ clientName: 'Acme' } as any);
            const payload = { userToken: { id: 'u1' }, fileDetails: { clientId: 'c1', caseId: 'case1' } } as any;
            const result = await controller.checkFileEligibility(payload);
            expect(service.checkFileEligibility).toHaveBeenCalledWith({ id: 'u1' }, { clientId: 'c1', caseId: 'case1' });
            expect(result).toEqual({ clientName: 'Acme' });
        });
    });

    describe('uploadS3File', () => {
        it('should delegate to service.uploadS3File', async () => {
            service.uploadS3File.mockResolvedValueOnce({ fileId: 'f1' } as any);
            const payload = { userToken: { id: 'u1' }, fileMetadata: { clientId: 'c1', caseId: 'case1' } } as any;
            const result = await controller.uploadS3File(payload);
            expect(service.uploadS3File).toHaveBeenCalledWith({ id: 'u1' }, { clientId: 'c1', caseId: 'case1' });
            expect(result).toEqual({ fileId: 'f1' });
        });
    });

    describe('updateFiles', () => {
        it('should delegate to service.updateS3File', async () => {
            service.updateS3File.mockResolvedValueOnce({ fileId: 'f1', fileName: 'x.pdf' } as any);
            const payload = { userToken: { id: 'u1' }, fileId: 'f1', fileMetadata: { fileName: 'x.pdf' } } as any;
            const result = await controller.updateFiles(payload);
            expect(service.updateS3File).toHaveBeenCalledWith({ id: 'u1' }, 'f1', { fileName: 'x.pdf' });
            expect(result).toEqual({ fileId: 'f1', fileName: 'x.pdf' });
        });
    });

    describe('deleteFile', () => {
        it('should delegate to service.deleteS3File', async () => {
            service.deleteS3File.mockResolvedValueOnce({ msg: 'File deleted successfully' } as any);
            const payload = { fileId: 'f1' } as any;
            const result = await controller.deleteFile(payload);
            expect(service.deleteS3File).toHaveBeenCalledWith('f1');
            expect(result).toEqual({ msg: 'File deleted successfully' });
        });
    });
});


