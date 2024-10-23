import IResponseStatus from '../../../interfaces/configurations/IResponseStatus';

export enum StatusEnum {
    ACCEPTED = 202,
    BAD_REQUEST = 400,
    CREATED = 201,
    FORBIDDEN = 403,
    INTERNAL_SERVER_ERROR = 500,
    NO_CONTENT = 204,
    NOT_FOUND = 404,
    OK = 200,
    REQUEST_TIMEOUT = 408,
    UNAUTHORIZED = 401,
}

const RESPONSE_STATUS_CODES: Record<string, IResponseStatus> = {
    ACCEPTED: {
        message: 'Accepted successfully',
        statusCode: StatusEnum.ACCEPTED,
    },
    BAD_REQUEST: {
        message: 'Bad request',
        statusCode: StatusEnum.BAD_REQUEST,
    },
    CREATED: {
        message: 'Created successfully',
        statusCode: StatusEnum.CREATED,
    },
    FORBIDDEN: {
        message: 'Forbidden',
        statusCode: StatusEnum.FORBIDDEN,
    },
    INTERNAL_SERVER_ERROR: {
        message: 'Internal Server Error',
        statusCode: StatusEnum.INTERNAL_SERVER_ERROR,
    },
    NO_CONTENT: {
        message: 'No content',
        statusCode: StatusEnum.NO_CONTENT,
    },
    NOT_FOUND: {
        message: 'Not Found',
        statusCode: StatusEnum.NOT_FOUND,
    },
    OK: {
        message: 'Ok',
        statusCode: StatusEnum.OK,
    },
    REQUEST_TIMEOUT: {
        message: 'Request Timeout',
        statusCode: StatusEnum.REQUEST_TIMEOUT,
    },
    UNAUTHORIZED: {
        message: 'Unauthorized',
        statusCode: StatusEnum.UNAUTHORIZED,
    },
};

export default RESPONSE_STATUS_CODES;
