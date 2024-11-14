import UserIssueController from '../../controllers/userIssue.controller';
import ICreateTemplateYearOutput from '../../interfaces/ICreateTemplateYearOutput';
import IDataIssue from '../../interfaces/IDataIssue';
import IEvidence from '../../interfaces/IEvidence';
import ISyncRedmineUserIssuesOutput from '../../interfaces/ISyncRedmineUserIssuesOutput';
import UserIssueService from '../../services/userIssue.service';
import { getEvidenceInfoMock } from '../mocks/evidenceDescriptionResponseMock';
import { getUserIssueReqBodyMock, getUserIssueReqHeaderMock } from '../mocks/getUserIssueRequestMock';
import { jiraIssuesProcessedMock } from '../mocks/jiraIssuesMock';
import { userIssueMock, userIssueMock2 } from '../mocks/userIssueMock';

const userIssueService: UserIssueService = UserIssueService.getInstance();

describe('UserIssueController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getInstance method', () => {
        it('should return the same jira service instance', () => {
            const userIssueController: UserIssueController = UserIssueController.getInstance();
            const userIssueController2 = UserIssueController.getInstance();
            expect(userIssueController).toBeInstanceOf(UserIssueController);
            expect(userIssueController).toStrictEqual(userIssueController2);
        });
    });

    describe('getUserIssues method', () => {
        it('should map the request parameters and return the service response', async () => {
            const request = {
                header: getUserIssueReqHeaderMock.header,
                body: {
                    jira_username: getUserIssueReqBodyMock.jira_username,
                    redmine_id: getUserIssueReqBodyMock.redmine_id,
                    month: getUserIssueReqBodyMock.month,
                    year: getUserIssueReqBodyMock.year,
                },
            };

            const expectedResult: IDataIssue = jiraIssuesProcessedMock();

            const getUserIssuesServiceMock = jest.spyOn(userIssueService, 'getUserIssues').mockImplementation(async () => expectedResult);

            const userIssueController: UserIssueController = UserIssueController.getInstance();

            const result = await userIssueController.getUserIssues(request);

            expect(result).toBe(expectedResult);

            expect(getUserIssuesServiceMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getUserIssuesDescriptions method', () => {
        it('should map the request parameters and return the service response', async () => {
            const request = {
                header: getUserIssueReqHeaderMock.header,
                body: {
                    jira_username: getUserIssueReqBodyMock.jira_username,
                    redmine_id: getUserIssueReqBodyMock.redmine_id,
                    month: getUserIssueReqBodyMock.month,
                    year: getUserIssueReqBodyMock.year,
                },
            };

            const expectedResult: IEvidence = getEvidenceInfoMock([userIssueMock, userIssueMock2]);

            const getUserIssuesDescriptionsMock = jest.spyOn(userIssueService, 'getUserIssuesDescriptions').mockImplementation(async () => expectedResult);

            const userIssueController: UserIssueController = UserIssueController.getInstance();

            const result = await userIssueController.getUserIssuesDescriptions(request);

            expect(result).toMatchObject(expectedResult);

            expect(getUserIssuesDescriptionsMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('createTemplate method', () => {
        it('should map the request parameters and return the service response', async () => {
            const request = {
                header: getUserIssueReqHeaderMock.header,
                body: {
                    jira_username: getUserIssueReqBodyMock.jira_username,
                    redmine_id: getUserIssueReqBodyMock.redmine_id,
                    month: getUserIssueReqBodyMock.month,
                    year: getUserIssueReqBodyMock.year,
                },
            };

            const expectedResult: IEvidence = getEvidenceInfoMock([userIssueMock, userIssueMock2]);

            const createTemplateMock = jest.spyOn(userIssueService, 'createTemplate').mockImplementation(async () => expectedResult);

            const userIssueController: UserIssueController = UserIssueController.getInstance();

            const result = await userIssueController.createTemplate(request);

            expect(result).toMatchObject(expectedResult);

            expect(createTemplateMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('createTemplateYear method', () => {
        it('should map the request parameters and return the service response', async () => {
            const request = {
                header: getUserIssueReqHeaderMock.header,
                body: {
                    jira_username: getUserIssueReqBodyMock.jira_username,
                    redmine_id: getUserIssueReqBodyMock.redmine_id,
                    month: getUserIssueReqBodyMock.month,
                    year: getUserIssueReqBodyMock.year,
                },
            };

            const expectedResult: ICreateTemplateYearOutput = {
                userDisplayName: 'Jhon Doe',
                evidencesCreated: { total: 10, evidences: [] },
                evidencesWithErrors: { total: 1, evidences: [] },
            };

            const createTemplateYearMock = jest.spyOn(userIssueService, 'createTemplatesYear').mockImplementation(async () => expectedResult);

            const userIssueController: UserIssueController = UserIssueController.getInstance();

            const result = await userIssueController.createTemplatesYear(request);

            expect(result).toMatchObject(expectedResult);

            expect(createTemplateYearMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('syncRedmineUserIssues method', () => {
        it('should map the request parameters and return the service response', async () => {
            const request = {
                header: getUserIssueReqHeaderMock.header,
                body: {
                    status_id: '*',
                    limit: 100,
                    offset: 0,
                },
            };

            const expectedResult: ISyncRedmineUserIssuesOutput = {
                createdRegisters: 501,
                time: '15949.131599999999 ms',
            };

            const syncRedmineUserIssuesMock = jest.spyOn(userIssueService, 'syncRedmineUserIssues').mockImplementation(async () => expectedResult);

            const userIssueController: UserIssueController = UserIssueController.getInstance();

            const result = await userIssueController.syncRedmineUserIssues(request);

            expect(result).toMatchObject(expectedResult);

            expect(syncRedmineUserIssuesMock).toHaveBeenCalledTimes(1);
        });
    });
});
