import BaseError from '../../../interfaces/configurations/IBaseError';
import RESPONSE_STATUS_CODES from './ResponseStatusCodes';

const INTERNAL_ERROR_CODES: Record<string, BaseError> = {
    GENERAL_UNKNOWN: {
        code: 1000,
        message: 'General unknown error',
        responseStatus: RESPONSE_STATUS_CODES.INTERNAL_SERVER_ERROR,
    },
    BAD_REQUEST: {
        code: 1001,
        message: 'Bad request',
        responseStatus: RESPONSE_STATUS_CODES.BAD_REQUEST,
    },
    USER_NOT_FOUND: {
        code: 4000,
        message: 'User Not Found error',
        responseStatus: RESPONSE_STATUS_CODES.NOT_FOUND,
    },
    PASSWORD_INVALID: {
        code: 4001,
        message: 'Invalid password',
        responseStatus: RESPONSE_STATUS_CODES.BAD_REQUEST,
    },
    UNAUTHORIZED: {
        code: 4002,
        message: 'Please authenticate',
        responseStatus: RESPONSE_STATUS_CODES.UNAUTHORIZED,
    },
    USER_ALREADY_EXISTS: {
        code: 4003,
        message: 'User email already exists, please enter a new email address',
        responseStatus: RESPONSE_STATUS_CODES.BAD_REQUEST,
    },
};

export default INTERNAL_ERROR_CODES;
