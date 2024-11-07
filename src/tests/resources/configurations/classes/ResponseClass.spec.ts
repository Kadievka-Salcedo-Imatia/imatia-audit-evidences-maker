import core from 'express';

import { Request } from 'express-serve-static-core';
import ControllerMockClass from '../../../mocks/ControllerMockClass';
import ControllerMockClassFailing from '../../../mocks/ControllerMockClassFailing';
import ControllerMockClassFailingWithBaseError from '../../../mocks/ControllerMockClassFailingWithBaseError';
import ResponseClass from '../../../../resources/configurations/classes/ResponseClass';
import RESPONSE_STATUS_CODES from '../../../../resources/configurations/constants/ResponseStatusCodes';

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
});
