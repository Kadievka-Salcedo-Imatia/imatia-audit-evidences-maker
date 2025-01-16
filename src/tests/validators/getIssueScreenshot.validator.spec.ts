import getIssueScreenshotValidator from '../../validators/userIssue/getIssueScreenshot.validator';

describe('getIssueScreenshotValidator Unit Tests', () => {
    it('should return validator failed true and message that body can not be empty', () => {
        const result = getIssueScreenshotValidator({});
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'request body can not be empty');
    });

    it('should return validator failed true and message a invalid property should be removed', () => {
        const result = getIssueScreenshotValidator({
            randomProperty: 1234,
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'the property "randomProperty" is invalid. Please removed it.');
    });

    it('should return validator failed true and message that link is required', () => {
        const result = getIssueScreenshotValidator({
            page_type: 'JIRA',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', '\"link\" is required');
    });

    it('should return validator failed false and message that validation passed with the minimum required fields', () => {
        const result = getIssueScreenshotValidator({
            page_type: 'JIRA',
            link: 'https://www.jira-example.com/browse/JX-132',
        });
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });

    it('should return validator failed false and message that validation passed with the minimum required fields redmine pageType', () => {
        const result = getIssueScreenshotValidator({
            page_type: 'REDMINE',
            link: 'https://www.jira-example.com/browse/JX-132',
        });
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });
});
