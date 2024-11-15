import core from 'express';

import { Request } from 'express-serve-static-core';
import ControllerMockClass from '../../../mocks/ControllerMockClass';
import ControllerMockClassFailing from '../../../mocks/ControllerMockClassFailing';
import ControllerMockClassFailingWithBaseError from '../../../mocks/ControllerMockClassFailingWithBaseError';
import ResponseClass from '../../../../resources/configurations/classes/ResponseClass';
import RESPONSE_STATUS_CODES from '../../../../resources/configurations/constants/ResponseStatusCodes';
import IResponseStatus from '../../../../interfaces/configurations/IResponseStatus';
import ResponseStatus from '../../../../resources/configurations/constants/ResponseStatusCodes';

const controllerMockClass = new ControllerMockClass();

const controllerMockClassFailing = new ControllerMockClassFailing();

const controllerMockClassFailingWithBaseError = new ControllerMockClassFailingWithBaseError();

const resMock = {
    status: () => ({
        send: () => {},
    }),
};

const reqMock: Request = {} as unknown as Request;

describe('ResponseClass Unit Tests', () => {
    describe('constructor', () => {
        it('should create a new ResponseClass', () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            expect(responseClass).toBeInstanceOf(ResponseClass);
            expect(responseClass).toHaveProperty('controllerInstance', controllerMockClass);
        });
    });

    describe('send', () => {
        it('should use the catch block if something wrong happens during the execution of the controller method', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.OK, 'controllerClassMethodDoesNotExist');
            expect(result).toBeUndefined();
        });

        it('should use the catch block if something wrong happens during the execution of the controller method and assigns general unknown message', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClassFailing);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.OK, 'methodThrowsWeirdError');
            expect(result).toBeUndefined();
        });

        it('should use the catch block if a controlled error happens during the execution of the controller method and assigns base error message', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClassFailingWithBaseError);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.OK, 'methodThrowsBaseError');
            expect(result).toBeUndefined();
        });

        it('should use send method with Response Status OK', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.OK, 'controllerClassMethod');
            expect(result).toBeUndefined();
        });

        it('should use send method with Response Status OK without data', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.OK, 'controllerClassMethodDataNull');
            expect(result).toBeUndefined();
        });

        it('should use send method with Response Status CREATED', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.CREATED, 'controllerClassMethod');
            expect(result).toBeUndefined();
        });

        it('should use send method with Response Status ACCEPTED', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.ACCEPTED, 'controllerClassMethod');
            expect(result).toBeUndefined();
        });

        it('should use send method with Response Status NO_CONTENT', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.NO_CONTENT, 'controllerClassMethod');
            expect(result).toBeUndefined();
        });

        it('should use send method with Response Status BAD_REQUEST', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.BAD_REQUEST, 'controllerClassMethod');
            expect(result).toBeUndefined();
        });

        it('should use send method with Response Status UNAUTHORIZED', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.UNAUTHORIZED, 'controllerClassMethod');
            expect(result).toBeUndefined();
        });

        it('should use send method with Response Status FORBIDDEN', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.FORBIDDEN, 'controllerClassMethod');
            expect(result).toBeUndefined();
        });

        it('should use send method with Response Status NOT_FOUND', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.NOT_FOUND, 'controllerClassMethod');
            expect(result).toBeUndefined();
        });

        it('should use send method with Response Status REQUEST_TIMEOUT', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.REQUEST_TIMEOUT, 'controllerClassMethod');
            expect(result).toBeUndefined();
        });

        it('should use send method with Response Status INTERNAL_SERVER_ERROR', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);
            const result = await responseClass.send(reqMock, resMock as unknown as core.Response, RESPONSE_STATUS_CODES.INTERNAL_SERVER_ERROR, 'controllerClassMethod');
            expect(result).toBeUndefined();
        });
    });

    describe('sendBadRequest', () => {
        it('should use sendBadRequest method with Response Status BAD REQUEST and custom error message', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);

            const sendMock = jest.fn().mockImplementation((_response) => {});

            const responseMock = {
                status: () => ({
                    send: sendMock,
                }),
            };

            const result = await responseClass.sendBadRequest(responseMock as any, 'error message');

            expect(result).toBeUndefined();
            expect(sendMock).toHaveBeenCalledTimes(1);
            expect(sendMock).toHaveBeenCalledWith({
                error: { code: 1001, message: 'error message' },
                message: 'Bad request',
                statusCode: 400,
            });
        });

        it('should use sendBadRequest method with Response Status BAD REQUEST with bad request', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);

            const sendMock = jest.fn().mockImplementation((_response) => {});

            const responseMock = {
                status: () => ({
                    send: sendMock,
                }),
            };

            const result = await responseClass.sendBadRequest(responseMock as any, '');

            expect(result).toBeUndefined();
            expect(sendMock).toHaveBeenCalledTimes(1);
            expect(sendMock).toHaveBeenCalledWith({
                error: { code: 1001, message: 'Bad request' },
                message: 'Bad request',
                statusCode: 400,
            });
        });
    });

    describe('download', () => {
        it('should execute download function if data contains the path', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);

            const downloadMock = jest.fn().mockImplementation((_path: string) => {});

            const responseMock: any = {
                status: (_statusCode: number) => ({
                    download: downloadMock,
                }),
            };

            const req: any = {};
            const responseStatus: IResponseStatus = ResponseStatus.OK;
            const method: string = 'downloadControllerMethod';
            const message: string | undefined = undefined;

            const result = await responseClass.download(req, responseMock, responseStatus, method, message);

            expect(result).toBeUndefined();

            expect(downloadMock).toHaveBeenCalledTimes(1);
            expect(downloadMock).toHaveBeenCalledWith('pathMock');
        });

        it('should handleError if data throws error', async () => {
            const responseClass: ResponseClass = new ResponseClass(controllerMockClass);

            const sendMock = jest.fn().mockImplementation((_response) => {});

            const responseMock: any = {
                status: (_statusCode: number) => ({
                    send: sendMock,
                }),
            };

            const req: any = {};
            const responseStatus: IResponseStatus = ResponseStatus.OK;
            const method: string = 'downloadControllerMethodFails';
            const message: string | undefined = undefined;

            const result = await responseClass.download(req, responseMock, responseStatus, method, message);

            expect(result).toBeUndefined();

            expect(sendMock).toHaveBeenCalledTimes(1);
            expect(sendMock).toHaveBeenCalledWith({
                statusCode: 500,
                message: 'Controller download method failed',
                error: {
                    code: 1000,
                    message: 'General unknown error',
                },
            });
        });
    });
});
