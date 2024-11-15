import { Response, NextFunction } from 'express';
import { handleErrorResponse } from '../resources/configurations/classes/ResponseClass';
import IResponse from '../interfaces/configurations/IResponse';
import BaseErrorClass from '../resources/configurations/classes/BaseErrorClass';
import INTERNAL_ERROR_CODES from '../resources/configurations/constants/InternalErrorCodes';
import getLogger from '../utils/logger';
import RESPONSE_STATUS_CODES from '../resources/configurations/constants/ResponseStatusCodes';

const log = getLogger('basicAuth.middleware.ts');

export function getCredentialsFromBasicAuth(authorization: string): string[] {
    const base64Credentials = authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    return credentials.split(':');
}

function isValidBasicAuthFormat(authorization: string): boolean {
    if (!authorization.startsWith('Basic ')) {
        return false;
    }

    const token = authorization.slice(6); // remove "Basic "

    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(token)) {
        return false;
    }

    return true;
}

export const basicAuthMiddleware = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    log.info('Start basicAuthMiddleware with req.headers:', req.headers);

    try {
        const authorization = req.header('Authorization');

        if (!authorization) {
            throw new BaseErrorClass(INTERNAL_ERROR_CODES.UNAUTHORIZED);
        }

        if (!isValidBasicAuthFormat(authorization)) {
            throw new BaseErrorClass({
                responseStatus: RESPONSE_STATUS_CODES.BAD_REQUEST,
                code: INTERNAL_ERROR_CODES.BAD_REQUEST.code,
                message: 'Invalid Basic authorization',
            });
        }

        const [username, password] = getCredentialsFromBasicAuth(authorization);

        req.header.getCredentials = [username, password];
        req.header.authorization = authorization;

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
