import { Test, TestingModule } from '@nestjs/testing';
import { S3FilingController } from './s3-filing.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { s3ClientService } from '../../s3-client-module/s3.client.service';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';

describe('S3FilingController', () => {
  let controller: S3FilingController;
  let natsClient: { send: jest.Mock };
  let s3Service: { uploadFile: jest.Mock; deleteFile: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(async () => {
    natsClient = { send: jest.fn() };
    s3Service = { uploadFile: jest.fn(), deleteFile: jest.fn() } as any;
    config = { get: jest.fn().mockReturnValue('prefix') } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [S3FilingController],
      providers: [
        { provide: 'Nats_messenger', useValue: natsClient as unknown as ClientProxy },
        { provide: s3ClientService, useValue: s3Service as unknown as s3ClientService },
        { provide: ConfigService, useValue: config as unknown as ConfigService },
      ],
    }).compile();

    controller = module.get<S3FilingController>(S3FilingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadS3Files', () => {
    const req: any = { user: { sub: 'user-id' } };
    const file: any = { originalname: 'doc.pdf', mimetype: 'application/pdf', size: 100, buffer: Buffer.from('x') };
    const fileDetails: any = { clientId: 'c1', caseId: 'cs1', fileName: 'f.pdf', fileType: 'type' };

    it('should upload to s3 and persist metadata', async () => {
      natsClient.send
        .mockReturnValueOnce(of({ clientName: 'ACME' })) // checkFileValidity
        .mockReturnValueOnce(of({ id: 's3-file-1' })); // uploadFileToS3
      s3Service.uploadFile.mockResolvedValue('s3-url');

      const res = await controller.uploadS3Files(file, req, fileDetails);

      expect(natsClient.send).toHaveBeenNthCalledWith(
        1,
        { cmd: 'checkFileValidity' },
        { userToken: req.user, fileDetails },
      );
      expect(s3Service.uploadFile).toHaveBeenCalledWith(expect.any(Object), expect.any(String));
      expect(natsClient.send).toHaveBeenNthCalledWith(
        2,
        { cmd: 'uploadFileToS3' },
        expect.objectContaining({ userToken: req.user, fileMetadata: expect.any(Object) }),
      );
      expect(res).toEqual({ msg: 'Success!! File uploaded to s3', s3File: { id: 's3-file-1' } });
    });
  });

  describe('updateS3File', () => {
    const req: any = { user: { sub: 'user-id' } };
    const fileId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';

    it('should update metadata only when no new file', async () => {
      const fileDetails: any = { Client: 'ACME', Case: 'C-1', fileName: 'n.pdf', fileType: 'type' };
      natsClient.send
        .mockReturnValueOnce(of([{ s3Key: 'key-old' }])) // searchFileById
        .mockReturnValueOnce(of({ clientName: 'ACME' })) // checkFileValidity
        .mockReturnValueOnce(of({ id: 'updated' })); // updateNewS3Files

      const res = await controller.updateS3File(undefined as any, fileId, fileDetails, req);

      expect(natsClient.send).toHaveBeenNthCalledWith(
        3,
        { cmd: 'updateNewS3Files' },
        expect.objectContaining({ userToken: req.user, fileId, fileMetadata: expect.any(Object) }),
      );
      expect(res).toEqual({ msg: 'File updated successfully', updatedFile: { id: 'updated' } });
    });

    it('should delete old file, upload new file, and update when new file provided', async () => {
      const fileDetails: any = { Client: 'ACME', Case: 'C-1', fileName: 'n.pdf', fileType: 'type' };
      const file: any = { originalname: 'doc.pdf', mimetype: 'application/pdf', size: 100, buffer: Buffer.from('x') };
      natsClient.send
        .mockReturnValueOnce(of([{ s3Key: 'key-old' }])) // searchFileById
        .mockReturnValueOnce(of({ clientName: 'ACME' })) // checkFileValidity
        .mockReturnValueOnce(of({ id: 'updated' })); // updateNewS3Files
      s3Service.deleteFile.mockResolvedValue(undefined);
      s3Service.uploadFile.mockResolvedValue('new-url');

      const res = await controller.updateS3File(file, fileId, fileDetails, req);
      expect(s3Service.deleteFile).toHaveBeenCalledWith('prefix/key-old');
      expect(s3Service.uploadFile).toHaveBeenCalledWith(file, expect.any(String));
      expect(res).toEqual({ msg: 'File updated successfully', updatedFile: { id: 'updated' } });
    });

    it('should cleanup and throw BAD_REQUEST when microservice returns error', async () => {
      const fileDetails: any = { Client: 'ACME', Case: 'C-1', fileName: 'n.pdf', fileType: 'type' };
      const file: any = { originalname: 'doc.pdf', mimetype: 'application/pdf', size: 100, buffer: Buffer.from('x') };
      natsClient.send
        .mockReturnValueOnce(of([{ s3Key: 'key-old' }])) // searchFileById
        .mockReturnValueOnce(of({ clientName: 'ACME' })) // checkFileValidity
        .mockReturnValueOnce(throwError(() => new Error('conflict'))); // updateNewS3Files

      await expect(controller.updateS3File(file, fileId, fileDetails, req)).rejects.toBeInstanceOf(HttpException);
      expect(s3Service.deleteFile).toHaveBeenCalledWith('prefix/key-old');
    });
  });

  describe('deleteS3File', () => {
    const req: any = { user: { sub: 'user-id' } };
    const fileId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';

    it('should delete metadata then delete file from s3', async () => {
      natsClient.send
        .mockReturnValueOnce(of([{ s3Key: 'key-old' }])) // searchFileById
        .mockReturnValueOnce(of({ acknowledged: true })); // deleteFile
      s3Service.deleteFile.mockResolvedValue({ ok: true });

      const res = await controller.deleteS3File(fileId, req);
      expect(config.get).toHaveBeenCalledWith('S3_PREFIX');
      expect(natsClient.send).toHaveBeenNthCalledWith(
        2,
        { cmd: 'deleteFile' },
        { userToken: req.user, fileId },
      );
      expect(res).toEqual({ ok: true });
    });
  });
});
