import IBaseError from '../../interfaces/configurations/IBaseError';
import BaseErrorClass from '../../resources/configurations/classes/BaseErrorClass';
import RESPONSE_STATUS_CODES from '../../resources/configurations/constants/ResponseStatusCodes';

export default class ControllerMockClassFailingWithBaseError {
    public async methodThrowsBaseError() {
        const baseError: IBaseError = {
            code: 200,
            message: 'I am an internal custom error message',
            responseStatus: RESPONSE_STATUS_CODES.INTERNAL_SERVER_ERROR,
        };
        throw new BaseErrorClass(baseError);
    }
}
