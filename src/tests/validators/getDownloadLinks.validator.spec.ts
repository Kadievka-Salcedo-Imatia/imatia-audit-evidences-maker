import getDownloadLinksValidator from '../../validators/userIssue/getDownloadLinks.validator';
import { getDownloadLinksInputMock } from '../mocks/getDownloadLinksInputMock';

describe('getDownloadLinksValidator Unit Tests', () => {
    it('should return validator failed false and message that validation passed', () => {
        const result = getDownloadLinksValidator({});
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });

    it('should return validator failed true and message a invalid property should be removed', () => {
        const result = getDownloadLinksValidator({
            randomProperty: 1234,
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'the property "randomProperty" is invalid. Please removed it.');
    });

    it('should return validator failed true and message "pageType" must be a string', () => {
        const result = getDownloadLinksValidator({
            pageType: 1234,
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', '"pageType" must be a string');
    });

    it('should return validator failed false and message validation passed if all fields are valid', () => {
        const result = getDownloadLinksValidator(getDownloadLinksInputMock);
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });
});
