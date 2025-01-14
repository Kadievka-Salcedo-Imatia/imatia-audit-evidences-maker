import getUserIssueDetailsValidator from '../../validators/userIssue/getUserIssueDetails.validator';

describe('getUserIssueDetailsValidator Unit Tests', () => {
    it('should return validator failed true and message that body can not be empty', () => {
        const result = getUserIssueDetailsValidator({});
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'request body can not be empty');
    });

    it('should return validator failed true and message a invalid property should be removed', () => {
        const result = getUserIssueDetailsValidator({
            randomProperty: 1234,
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'the property "randomProperty" is invalid. Please removed it.');
    });

    it('should return validator failed true and message that issue_id is required', () => {
        const result = getUserIssueDetailsValidator({
            page_type: 'JIRA',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', '\"issue_id\" is required');
    });

    it('should return validator failed false and message that validation passed with the minimum required fields', () => {
        const result = getUserIssueDetailsValidator({
            page_type: 'JIRA',
            issue_id: '44224',
        });
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });

    it('should return validator failed false and message that validation passed with the minimum required fields redmine_id', () => {
        const result = getUserIssueDetailsValidator({
            page_type: 'REDMINE',
            issue_id: '44224',
        });
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });
});
