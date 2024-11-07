import BaseErrorClass from '../../../../resources/configurations/classes/BaseErrorClass';
import INTERNAL_ERROR_CODES from '../../../../resources/configurations/constants/InternalErrorCodes';

describe('BaseErrorClass Unit Tests', () => {
    describe('constructor', () => {
        it('should create a new ResponseClass', () => {
            const baseErrorClass: BaseErrorClass = new BaseErrorClass(INTERNAL_ERROR_CODES.GENERAL_UNKNOWN);

            expect(baseErrorClass).toBeInstanceOf(BaseErrorClass);
            expect(baseErrorClass).toHaveProperty('code', 1000);
            expect(baseErrorClass).toHaveProperty('message', 'General unknown error');
            expect(baseErrorClass).toHaveProperty('responseStatus');
            expect(baseErrorClass.responseStatus).toHaveProperty('message', 'Internal Server Error');
            expect(baseErrorClass.responseStatus).toHaveProperty('statusCode', 500);
        });
    });
});
