import { NextFunction } from 'express';
import { basicAuthMiddleware } from '../../middlewares/basicAuth.middleware';

describe('basicAuthMiddleware', () => {
    it('should throw error if authorization is undefined', async () => {
        const sendMock = jest.fn().mockImplementation((_response) => {});

        const req: any = {
            header: (_property: string) => {},
        };

        const res: any = {
            status: (_statusCode: number) => ({
                send: sendMock,
            }),
        };

        const next: NextFunction = () => {};

        await basicAuthMiddleware(req, res, next);

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledWith({
            error: {
                code: 4002,
                message: 'Authorization required',
            },
            message: 'Unauthorized',
            statusCode: 401,
        });
    });

    it('should throw error if authorization is invalid', async () => {
        const sendMock = jest.fn().mockImplementation((_response) => {});

        const req: any = {
            header: (_property: string) => 'invalid authorization',
        };

        const res: any = {
            status: (_statusCode: number) => ({
                send: sendMock,
            }),
        };

        const next: NextFunction = () => {};

        await basicAuthMiddleware(req, res, next);

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledWith({
            message: 'Bad request',
            statusCode: 400,
            error: {
                code: 1001,
                message: 'Invalid Basic authorization',
            },
        });
    });

    it('should throw error if authorization is invalid for the token', async () => {
        const sendMock = jest.fn().mockImplementation((_response) => {});

        const req: any = {
            header: (_property: string) => 'Basic authorization.-',
        };

        const res: any = {
            status: (_statusCode: number) => ({
                send: sendMock,
            }),
        };

        const next: NextFunction = () => {};

        await basicAuthMiddleware(req, res, next);

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledWith({
            message: 'Bad request',
            statusCode: 400,
            error: {
                code: 1001,
                message: 'Invalid Basic authorization',
            },
        });
    });

    it('should throw error if password is undefined', async () => {
        const sendMock = jest.fn().mockImplementation((_response) => {});

        const req: any = {
            header: (_property: string) => 'Basic amhvbi5kb2U6=',
        };

        const res: any = {
            status: (_statusCode: number) => ({
                send: sendMock,
            }),
        };

        const next: NextFunction = () => {};

        await basicAuthMiddleware(req, res, next);

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledWith({
            message: 'Bad request',
            statusCode: 400,
            error: {
                code: 1001,
                message: 'Invalid Basic authorization, missing user or password',
            },
        });
    });

    it('should throw error if username is undefined', async () => {
        const sendMock = jest.fn().mockImplementation((_response) => {});

        const req: any = {
            header: (_property: string) => 'Basic OjEyM2FiYy4=',
        };

        const res: any = {
            status: (_statusCode: number) => ({
                send: sendMock,
            }),
        };

        const next: NextFunction = () => {};

        await basicAuthMiddleware(req, res, next);

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledWith({
            message: 'Bad request',
            statusCode: 400,
            error: {
                code: 1001,
                message: 'Invalid Basic authorization, missing user or password',
            },
        });
    });

    it('should pass validation and call next()', async () => {
        const sendMock = jest.fn().mockImplementation((_response) => {});

        const req: any = {
            header: (_property: string) => 'Basic amhvbi5kb2U6MTIzYXNkMSsq',
        };

        const res: any = {
            status: (_statusCode: number) => ({
                send: sendMock,
            }),
        };

        const nextMock = jest.fn().mockImplementation(() => {});

        await basicAuthMiddleware(req, res, nextMock);

        expect(nextMock).toHaveBeenCalledTimes(1);
        expect(req.header).toHaveProperty('getCredentials', ['jhon.doe', '123asd1+*']);
        expect(req.header).toHaveProperty('authorization', 'Basic amhvbi5kb2U6MTIzYXNkMSsq');
    });
});
