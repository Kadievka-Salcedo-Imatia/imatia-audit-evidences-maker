import BaseErrorClass from './BaseErrorClass';
import core from 'express';
import getLogger from '../../../utils/logger';
import INTERNAL_ERROR_CODES from '../constants/InternalErrorCodes';
import IResponseStatus from '../../../interfaces/configurations/IResponseStatus';
import IResponse from '../../../interfaces/configurations/IResponse';
import IDownloadOutput from '../../../interfaces/IDownloadOutput';

const log = getLogger('ResponseClass.ts');

export default class ResponseClass {
    public controllerInstance: any;

    constructor(controllerInstance: any) {
        this.controllerInstance = controllerInstance;
    }

    /**
     * Makes the request to the app or handles errors.
     * @param {core.Request} req http request object
     * @param {core.Request} res http response object
     * @param {IResponseStatus} responseStatus message and statusCode
     * @param {string} method The name of the controller's function to be called
     * @param {string | undefined} message The message that must be displayed
     * @returns {Promise<void>} void
     */
    public async send(req: core.Request, res: core.Response, responseStatus: IResponseStatus, method: string, message?: string): Promise<void> {
        let response: IResponse = {
            message: message || responseStatus?.message,
            statusCode: responseStatus.statusCode,
        };

        try {
            const data: any = await this.controllerInstance[method](req);
            response.data = data ? data : {};
        } catch (error) {
            log.error('send method failed with error: ', error);
            response = handleErrorResponse(error, response);
        }

        res.status(response.statusCode).send(response);
    }

    /**
     * Generates bad request response if validator fails.
     * @param {core.Request} res http response object
     * @param {string} message The message that must be displayed
     * @returns {Promise<void>} void
     */
    public async sendBadRequest(res: core.Response, message: string): Promise<void> {
        const response: IResponse = {
            message: INTERNAL_ERROR_CODES.BAD_REQUEST.responseStatus.message,
            statusCode: INTERNAL_ERROR_CODES.BAD_REQUEST.responseStatus.statusCode,
            error: {
                code: INTERNAL_ERROR_CODES.BAD_REQUEST.code,
                message: message ? message : INTERNAL_ERROR_CODES.BAD_REQUEST.message,
            },
        };
        res.status(response.statusCode).send(response);
    }

    /**
     * Makes the request to the app or handles errors.
     * @param {core.Request} req http request object
     * @param {core.Request} res http response object
     * @param {IResponseStatus} responseStatus message and statusCode
     * @param {string} method The name of the controller's function to be called
     * @param {string | undefined} message The message that must be displayed
     * @returns {Promise<void>} void
     */
    public async download(req: core.Request, res: core.Response, responseStatus: IResponseStatus, method: string, message?: string): Promise<any> {
        let response: IResponse = {
            message: message || responseStatus?.message,
            statusCode: responseStatus.statusCode,
        };

        let data: IDownloadOutput | undefined;

        data = await this.controllerInstance[method](req);

        if (data && data.path) {
            res.status(response.statusCode).download(data.path);
        } else {
            response = handleErrorResponse(data, response);
            res.status(response.statusCode).send(response);
        }
    }
}

export function handleErrorResponse(error: any, response: IResponse): IResponse {
    if (error instanceof BaseErrorClass) {
        response.statusCode = error.responseStatus.statusCode;
        response.message = error.responseStatus.message;
        response.error = {
            code: error.code,
            message: error.message,
        };
    } else {
        response.statusCode = INTERNAL_ERROR_CODES.GENERAL_UNKNOWN.responseStatus.statusCode;
        response.message = error.message ? error.message : INTERNAL_ERROR_CODES.GENERAL_UNKNOWN.responseStatus.message;
        response.error = {
            code: INTERNAL_ERROR_CODES.GENERAL_UNKNOWN.code,
            message: INTERNAL_ERROR_CODES.GENERAL_UNKNOWN.message,
        };
    }
    return response;
}
