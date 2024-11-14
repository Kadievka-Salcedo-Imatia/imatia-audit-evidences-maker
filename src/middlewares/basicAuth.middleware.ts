import { Response, NextFunction } from 'express';
import { handleErrorResponse } from '../resources/configurations/classes/ResponseClass';
import IResponse from '../interfaces/configurations/IResponse';
import BaseErrorClass from '../resources/configurations/classes/BaseErrorClass';
import INTERNAL_ERROR_CODES from '../resources/configurations/constants/InternalErrorCodes';
import getLogger from '../utils/logger';

const log = getLogger('basicAuth.middleware.ts');

export function getCredentialsFromBasicAuth(authorization: string): string[] {
    const base64Credentials = authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    return credentials.split(':');
}

export const basicAuthMiddleware = async (req: any, res: Response, next: NextFunction) => {
    log.info('Start basicAuthMiddleware with req.headers:', req.headers);

    try {
        const authorization = req.header('Authorization');

        if (!authorization) {
            throw new BaseErrorClass(INTERNAL_ERROR_CODES.UNAUTHORIZED);
        }

        const [username, password] = getCredentialsFromBasicAuth(authorization);

        // this value is inserted to call this function once
        req.header.getCredentials = [username, password];

        log.info('Finish basicAuthMiddleware');

        next();
    } catch (error) {
        const response: IResponse = {
            statusCode: 500,
        };
        handleErrorResponse(error, response);

        log.info('Error basicAuthMiddleware:', { error });
        res.status(response.statusCode).send(response);
    }
};
