 import { Test, TestingModule } from '@nestjs/testing';
 import { FilesController } from './files.controller';
 import { ClientProxy } from '@nestjs/microservices';
 import { of, throwError } from 'rxjs';
 import { NotFoundException } from '@nestjs/common';
 import { ConfigService } from '@nestjs/config';
 import { s3ClientService } from '../../s3-client-module/s3.client.service';
 import * as fs from 'fs';

 describe('FilesController', () => {
   let controller: FilesController;
   let natsClient: { send: jest.Mock };
   let configService: { get: jest.Mock };
   let s3Service: { downloadFile: jest.Mock };

   beforeEach(async () => {
     natsClient = { send: jest.fn() };
     configService = { get: jest.fn().mockReturnValue('s3-prefix') } as any;
     s3Service = { downloadFile: jest.fn() } as any;

     const module: TestingModule = await Test.createTestingModule({
       controllers: [FilesController],
       providers: [
         { provide: 'Nats_messenger', useValue: natsClient as unknown as ClientProxy },
         { provide: ConfigService, useValue: configService as unknown as ConfigService },
         { provide: s3ClientService, useValue: s3Service as unknown as s3ClientService },
       ],
     }).compile();

     controller = module.get<FilesController>(FilesController);
   });

   it('should be defined', () => {
     expect(controller).toBeDefined();
   });

   describe('uploadFile', () => {
     const req: any = { user: { sub: 'user-id' } };
     const file: any = { originalname: 'doc.pdf', mimetype: 'application/pdf', size: 10, path: 'file-uploads/doc.pdf', filename: 'doc-123.pdf' };
     const fileDetails: any = { caseNumber: 'C-1', client: 'ACME' };

     it('should upload and return success message', async () => {
       const fileInfo = { id: 'f1' };
       natsClient.send.mockReturnValue(of(fileInfo));

       const res = await controller.uploadFile(file, fileDetails, req);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'createNewFile' },
         { userToken: req.user, fileMetadata: expect.objectContaining({ originalName: 'doc.pdf', mimeType: 'application/pdf' }) },
       );
       expect(res).toEqual({ msg: 'File uploaded successfully', fileInfo });
     });

     it('should unlink file and rethrow on error', async () => {
       const unlinkSpy = jest.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined as any);
       natsClient.send.mockReturnValue(throwError(() => new Error('db error')));

       await expect(controller.uploadFile(file, fileDetails, req)).rejects.toBeInstanceOf(Error);
       expect(unlinkSpy).toHaveBeenCalledWith(file.path);

       unlinkSpy.mockRestore();
     });
   });

   describe('getAllFiles', () => {
     const req: any = { user: { sub: 'user-id' } };

     it('should return success when data not empty', async () => {
       const allFiles = { data: [{ id: 'f1' }] };
       natsClient.send.mockReturnValue(of(allFiles));
       const res = await controller.getAllFiles(req, 1, 10);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'searchAllFiles' },
         { userToken: req.user, page: 1, limit: 10 },
       );
       expect(res).toEqual({ msg: 'success', allFiles });
     });

     it('should return message when empty', async () => {
       const allFiles = { data: [] };
       natsClient.send.mockReturnValue(of(allFiles));
       const res = await controller.getAllFiles(req, 1, 10);
       expect(res).toEqual({ msg: 'No files at the moment' });
     });
   });

   describe('getFileId', () => {
     const req: any = { user: { sub: 'user-id' } };
     const fileId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';

     it('should return success when found', async () => {
       const found = [{ id: fileId }];
       natsClient.send.mockReturnValue(of(found));

       const res = await controller.getFileId(req, fileId);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'searchFileById' },
         { userToken: req.user, fileId },
       );
       expect(res).toEqual({ msg: 'success', foundFile: found });
     });

     it('should throw NotFound when not found', async () => {
       natsClient.send.mockReturnValue(of([]));
       await expect(controller.getFileId(req, fileId)).rejects.toBeInstanceOf(NotFoundException);
     });
   });

   describe('searchFiles', () => {
     const req: any = { user: { sub: 'user-id' } };

     it('should build criteria and return hits', async () => {
       const hits = [{ id: 'f1' }, { id: 'f2' }];
       natsClient.send.mockReturnValue(of(hits));

       const res = await controller.searchFiles('ACME', 'C-1', 'contract.pdf', req);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'searchFileCriteria' },
         { userToken: req.user, searchCriteria: { client: 'ACME', caseNumber: 'C-1', filename: 'contract.pdf' } },
       );
       expect(res).toEqual({ msg: 'success', hits: hits.length, searchedFile: hits });
     });
   });

   describe('updateFile', () => {
     const req: any = { user: { sub: 'user-id' } };
     const id = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';

     it('should update metadata only when file not provided', async () => {
       const body: any = { fileName: undefined, description: 'new' };
       const updatedFile = { id, ...body };
       natsClient.send.mockReturnValueOnce(of([{ filepath: 'old-path' }])) // searchFileById
                          .mockReturnValueOnce(of(updatedFile)); // updateFiles

       const res = await controller.updateFile(undefined as any, req, body, id);
       expect(natsClient.send).toHaveBeenCalledWith(
         { cmd: 'updateFiles' },
         { userToken: req.user, id, fileMetadata: { description: 'new' } },
       );
       expect(res).toBeInstanceOf(Object)
     });

     it('should unlink old file and update when new file provided', async () => {
       const file: any = { filename: 'new.pdf', mimetype: 'application/pdf', size: 1, path: 'file-uploads/new.pdf' };
       const body: any = { fileName: 'new.pdf', description: 'updated' };
       const existing = [{ filepath: 'file-uploads/old.pdf' }];
       const unlinkSpy = jest.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined as any);

       natsClient.send.mockReturnValueOnce(of(existing)) // searchFileById
                      .mockReturnValueOnce(of({ id, diskName: file.filename })); // updateFiles

       const res = await controller.updateFile(file, req, body, id);
       expect(unlinkSpy).toHaveBeenCalledWith(existing[0].filepath);
       expect(res).toBeInstanceOf(Object)

       unlinkSpy.mockRestore();
     });

     it('should cleanup uploaded file when update fails', async () => {
       const file: any = { filename: 'new.pdf', mimetype: 'application/pdf', size: 1, path: 'file-uploads/new.pdf' };
       const body: any = { fileName: 'new.pdf' };
       const unlinkSpy = jest.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined as any);

       // first call: searchFileById succeeds; second call: updateFiles throws
       natsClient.send.mockReturnValueOnce(of([{ filepath: 'old' }]))
                      .mockReturnValueOnce(throwError(() => new Error('update failed')));

       await expect(controller.updateFile(file, req, body, id)).rejects.toBeInstanceOf(Error);
       expect(unlinkSpy).toHaveBeenCalledWith(file.path);

       unlinkSpy.mockRestore();
     });
   });

   describe('downloadFile', () => {
     const req: any = { user: { sub: 'user-id' } };
     const res: any = { set: jest.fn(), }; // pipe is called on stream, not on res
     const fileId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';

     it('should stream from s3 when s3Key exists', async () => {
       const s3Body: any = { pipe: jest.fn() };
       s3Service.downloadFile.mockResolvedValue({ Body: s3Body, ContentType: 'application/pdf' });
       natsClient.send.mockReturnValue(of([{ fileName: 'name.pdf', s3Key: 'k', filepath: '', mimeType: 'application/pdf' }]));

       await controller.downloadFile(req, res, fileId);
       expect(s3Service.downloadFile).toHaveBeenCalled();
       expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'application/pdf' }));
       expect(s3Body.pipe).toHaveBeenCalledWith(res);
     });

     it('should stream from local disk when no s3Key', async () => {
       const stream: any = { pipe: jest.fn() };
       jest.spyOn(fs, 'createReadStream').mockReturnValue(stream as any);
       natsClient.send.mockReturnValue(of([{ fileName: 'name.pdf', s3Key: '', filepath: 'file-uploads/a.pdf', mimeType: 'application/pdf' }]));

       await controller.downloadFile(req, res, fileId);
       expect(fs.createReadStream).toHaveBeenCalledWith('file-uploads/a.pdf');
       expect(stream.pipe).toHaveBeenCalledWith(res);
     });
   });

   describe('deleteLocalFile', () => {
     const req: any = { user: { sub: 'user-id' } };
     const fileId = 'b8f4d77b-5d61-4c12-9e04-9a2b3b1b6b2a';

     it('should delete metadata and unlink local file', async () => {
       const unlinkSpy = jest.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined as any);
       natsClient.send.mockReturnValueOnce(of([{ filepath: 'file-uploads/a.pdf' }])) // searchFileById
                      .mockReturnValueOnce(of({ acknowledged: true })) // deleteDiskFile

       const res = await controller.deleteLocalFile(fileId, req);
       expect(unlinkSpy).toHaveBeenCalledWith('file-uploads/a.pdf');
       expect(res).toEqual({ msg: 'File Deleted successfully' });
       unlinkSpy.mockRestore();
     });
   });
 });
