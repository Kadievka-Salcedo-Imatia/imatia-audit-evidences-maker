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
    UNAUTHORIZED: {
        code: 4002,
        message: 'Please authenticate',
        responseStatus: RESPONSE_STATUS_CODES.UNAUTHORIZED,
    },
};

export default INTERNAL_ERROR_CODES;
