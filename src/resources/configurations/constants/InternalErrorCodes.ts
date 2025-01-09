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
        message: 'Authorization required',
        responseStatus: RESPONSE_STATUS_CODES.UNAUTHORIZED,
    },
    FILE_NOT_FOUND: {
        code: 4003,
        message: 'The specified file path does not exist in the directory: ',
        responseStatus: RESPONSE_STATUS_CODES.NOT_FOUND,
    },
    JIRA_ISSUE_NOT_FOUND: {
        code: 4004,
        message: 'The specified jira issue is not found, please verify the params you passed are right',
        responseStatus: RESPONSE_STATUS_CODES.NOT_FOUND,
    },
    REDMINE_ISSUE_NOT_FOUND: {
        code: 4005,
        message: 'The specified redmine issue is not found, please verify the params you passed are right',
        responseStatus: RESPONSE_STATUS_CODES.NOT_FOUND,
    },
    USER_TEMPLATE_NOT_FOUND: {
        code: 4004,
        message: 'The specified user template id does not exist in the DB: ',
        responseStatus: RESPONSE_STATUS_CODES.NOT_FOUND,
    },
};

export default INTERNAL_ERROR_CODES;
