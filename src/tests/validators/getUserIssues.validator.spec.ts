import getUserIssuesValidator from '../../validators/userIssue/getUserIssues.validator';
import { getUserIssueReqBodyMock } from '../mocks/getUserIssueRequestMock';

describe('getUserIssuesValidator Unit Tests', () => {
    it('should return validator failed true and message that body can not be empty', () => {
        const result = getUserIssuesValidator({});
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'request body can not be empty');
    });

    it('should return validator failed true and message a invalid property should be removed', () => {
        const result = getUserIssuesValidator({
            randomProperty: 1234,
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'the property "randomProperty" is invalid. Please removed it.');
    });

    it('should return validator failed true and message that year is missing', () => {
        const result = getUserIssuesValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'property "year" is required. Please specify a valid year.');
    });

    it('should return validator failed true and message that year should be a positive number', () => {
        const result = getUserIssuesValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            year: '2024',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'property "year" must be a positive number');
    });

    it('should return validator failed true and message that month is missing', () => {
        const result = getUserIssuesValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            year: getUserIssueReqBodyMock.year,
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'property "month" is required. Please specify a valid month.');
    });

    it('should return validator failed true and message that month should be a positive number', () => {
        const result = getUserIssuesValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            year: getUserIssueReqBodyMock.year,
            month: '11',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'property "month" must be a positive number');
    });

    it('should return validator failed false and message that validation passed with the minimum required fields', () => {
        const result = getUserIssuesValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            year: getUserIssueReqBodyMock.year,
            month: 11,
        });
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });

    it('should return validator failed true and message that "rewrite_files" must be a boolean', () => {
        const result = getUserIssuesValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            year: getUserIssueReqBodyMock.year,
            month: 11,
            rewrite_files: 'asd',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', '"rewrite_files" must be a boolean');
    });

    it('should return validator failed true and message that "jira_base_url" must be a valid uri', () => {
        const result = getUserIssuesValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            year: getUserIssueReqBodyMock.year,
            month: 11,
            jira_base_url: 'external-jira-base-url',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', '"jira_base_url" must be a valid uri');
    });

    it('should return validator failed false and message validation passed when all fields are passed', () => {
        const result = getUserIssuesValidator({ ...getUserIssueReqBodyMock });
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });
});
