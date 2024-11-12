import getUserIssuesYearValidator from '../../validators/userIssue/getUserIssuesYear.validator';
import { getUserIssueReqBodyMock } from '../mocks/getUserIssueRequestMock';

describe('getUserIssuesYearValidator Unit Tests', () => {
    it('should return validator failed true and message that body can not be empty', () => {
        const result = getUserIssuesYearValidator({});
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'request body can not be empty');
    });

    it('should return validator failed true and message a invalid property should be removed', () => {
        const result = getUserIssuesYearValidator({
            randomProperty: 1234,
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'the property "randomProperty" is invalid. Please removed it.');
    });

    it('should return validator failed true and message that year is missing', () => {
        const result = getUserIssuesYearValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'property "year" is required. Please specify a valid year.');
    });

    it('should return validator failed true and message that year should be a positive number', () => {
        const result = getUserIssuesYearValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            year: '2024',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'property "year" must be a positive number');
    });

    it('should return validator failed true and message that month is invalid', () => {
        const result = getUserIssuesYearValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            year: getUserIssueReqBodyMock.year,
            month: '11',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', 'the property "month" is invalid. Please removed it.');
    });

    it('should return validator failed false and message that validation passed with the minimum required fields', () => {
        const result = getUserIssuesYearValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            year: getUserIssueReqBodyMock.year,
        });
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });

    it('should return validator failed true and message that "rewrite_files" must be a boolean', () => {
        const result = getUserIssuesYearValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            year: getUserIssueReqBodyMock.year,
            rewrite_files: 'asd',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', '"rewrite_files" must be a boolean');
    });

    it('should return validator failed true and message that "jira_base_url" must be a valid uri', () => {
        const result = getUserIssuesYearValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            year: getUserIssueReqBodyMock.year,
            jira_base_url: 'external-jira-base-url',
        });
        expect(result).toHaveProperty('validatorFailed', true);
        expect(result).toHaveProperty('message', '"jira_base_url" must be a valid uri');
    });

    it('should return validator failed false and message validation passed when all fields are passed', () => {
        const result = getUserIssuesYearValidator({
            jira_username: getUserIssueReqBodyMock.jira_username,
            redmine_id: getUserIssueReqBodyMock.redmine_id,
            year: getUserIssueReqBodyMock.year,
            rewrite_files: getUserIssueReqBodyMock.rewrite_files,
            jira_base_url: getUserIssueReqBodyMock.jira_base_url,
            jira_url: getUserIssueReqBodyMock.jira_url,
            jql: getUserIssueReqBodyMock.jql,
        });
        expect(result).toHaveProperty('validatorFailed', false);
        expect(result).toHaveProperty('message', 'validation passed');
    });
});
