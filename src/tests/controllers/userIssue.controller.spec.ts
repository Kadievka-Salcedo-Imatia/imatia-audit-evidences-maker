import UserIssueController from '../../controllers/userIssue.controller';
import ICreateTemplateYearOutput from '../../interfaces/ICreateTemplateYearOutput';
import IDataIssue from '../../interfaces/IDataIssue';
import IDownloadOutput from '../../interfaces/IDownloadOutput';
import IEvidence from '../../interfaces/IEvidence';
import IGetDownloadLinksOutput from '../../interfaces/IGetDownloadLinksOutput';
import ISyncRedmineUserIssuesOutput from '../../interfaces/ISyncRedmineUserIssuesOutput';
import IUserIssueDetail from '../../interfaces/IUserIssueDetail';
import UserIssueService from '../../services/userIssue.service';
import { getEvidenceInfoMock } from '../mocks/evidenceDescriptionResponseMock';
import { getUserIssueDetailReqBodyMock, getUserIssueReqBodyMock, getUserIssueReqHeaderMock } from '../mocks/getUserIssueRequestMock';
import { jiraIssuesProcessedMock } from '../mocks/jiraIssuesMock';
import { userIssueDetailMock, userIssueMock, userIssueMock2 } from '../mocks/userIssueMock';

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

    describe('getUserIssueDetails method', () => {
        it('should map the request parameters and return the service response', async () => {
            const request = {
                header: getUserIssueReqHeaderMock.header,
                body: {
                    jira_username: getUserIssueDetailReqBodyMock.jira_username,
                    redmine_id: getUserIssueDetailReqBodyMock.redmine_id,
                    issue_id: getUserIssueDetailReqBodyMock.issue_id,
                },
            };

            const expectedResult: IUserIssueDetail = userIssueDetailMock;

            const getUserIssuesServiceMock = jest.spyOn(userIssueService, 'getUserIssueDetail').mockImplementation(async () => expectedResult);

            const userIssueController: UserIssueController = UserIssueController.getInstance();

            const result = await userIssueController.getUserIssueDetails(request);

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

    describe('getDownloadLinks method', () => {
        it('should return download links in a list', async () => {
            const request = {
                header: getUserIssueReqHeaderMock.header,
                query: {
                    pageType: 'JIRA',
                    year: '2024',
                    offset: '0',
                    limit: '100',
                },
            };

            const expectedResult: IGetDownloadLinksOutput[] = [
                {
                    pageType: 'JIRA',
                    year: 2024,
                    month: 'MARZO',
                    downloadUrl: 'http://localhost:3000/user-issues/download/6734c5429411eee699ab6257',
                },
            ];

            const getDownloadLinksServiceMock = jest.spyOn(userIssueService, 'getDownloadLinks').mockImplementation(async () => expectedResult);

            const userIssueController: UserIssueController = UserIssueController.getInstance();

            const result = await userIssueController.getDownloadLinks(request);

            expect(result).toMatchObject(expectedResult);

            expect(getDownloadLinksServiceMock).toHaveBeenCalledTimes(1);
        });
        it('should return download links in a list with query empty', async () => {
            const request = {
                header: getUserIssueReqHeaderMock.header,
                query: {},
            };

            const expectedResult: IGetDownloadLinksOutput[] = [
                {
                    pageType: 'JIRA',
                    year: 2024,
                    month: 'MARZO',
                    downloadUrl: 'http://localhost:3000/user-issues/download/6734c5429411eee699ab6257',
                },
            ];

            const getDownloadLinksServiceMock = jest.spyOn(userIssueService, 'getDownloadLinks').mockImplementation(async () => expectedResult);

            const userIssueController: UserIssueController = UserIssueController.getInstance();

            const result = await userIssueController.getDownloadLinks(request);

            expect(result).toMatchObject(expectedResult);

            expect(getDownloadLinksServiceMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('downloadTemplate method', () => {
        it('should call downloadTemplate service a return a path to download', async () => {
            const request = {
                header: getUserIssueReqHeaderMock.header,
                params: {
                    id: '6734c5429411eee699ab6257',
                },
            };

            const expectedResult: IDownloadOutput = {
                path: 'http://localhost:3000/user-issues/download/6734c5429411eee699ab6257',
            };

            const downloadTemplateServiceMock = jest.spyOn(userIssueService, 'downloadTemplate').mockImplementation(async () => expectedResult);

            const userIssueController: UserIssueController = UserIssueController.getInstance();

            const result = await userIssueController.downloadTemplate(request);

            expect(result).toMatchObject(expectedResult);

            expect(downloadTemplateServiceMock).toHaveBeenCalledTimes(1);
        });
    });
});
