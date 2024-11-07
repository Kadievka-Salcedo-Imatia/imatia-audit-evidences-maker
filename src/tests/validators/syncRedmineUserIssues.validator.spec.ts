import syncRedmineUserIssues from '../../validators/userIssue/syncRedmineUserIssues.validator';
import { syncRedmineUserIssuesReqBodyMock } from '../mocks/syncRedmineUserIssuesRequestMock';

describe('syncRedmineUserIssues Unit Tests', () => {
    it('should return validator failed false and message that validation passed when body is undefined', () => {
        const result = syncRedmineUserIssues(undefined);
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });

    it('should return validator failed false and message that validation passed when body is empty', () => {
        const result = syncRedmineUserIssues({});
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });

    it('should return validator failed true and message a invalid property should be removed', () => {
        const result = syncRedmineUserIssues({
            randomProperty: 1234,
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'the property "randomProperty" is invalid. Please removed it.');
    });

    it('should return validator failed true and message "status_id" must be a string', () => {
        const result = syncRedmineUserIssues({
            status_id: false,
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', '"status_id" must be a string');
    });

    it('should return validator failed true and message "limit" must be a number', () => {
        const result = syncRedmineUserIssues({
            limit: 'abc',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', '"limit" must be a number');
    });

    it('should return validator failed true and message "offset" must be a number', () => {
        const result = syncRedmineUserIssues({
            offset: 'abc',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', '"offset" must be a number');
    });

    it('should return validator failed false and message validation passed when all fields are passed', () => {
        const result = syncRedmineUserIssues(syncRedmineUserIssuesReqBodyMock);
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });
});
