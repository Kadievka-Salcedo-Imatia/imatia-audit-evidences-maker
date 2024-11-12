import fs from 'fs';
import { getUserIssueReqBodyMock } from './../mocks/getUserIssueRequestMock';
import { PageTypeEnum } from '../../enums/PageTypeEnum';
import IDataIssue from '../../interfaces/IDataIssue';
import IGetIssueFromRedmineInput from '../../interfaces/IGetIssueFromRedmineInput';
import IUserIssuesInput from '../../interfaces/IUserIssuesInput';
import UserIssueModel, { mongooseModel } from '../../models/UserIssueModel';
import RedmineService from '../../services/redmine.service';
import UserIssueService from '../../services/userIssue.service';
import { getUserIssueReqHeaderMock } from '../mocks/getUserIssueRequestMock';
import { redmineIssuesMock } from '../mocks/redmineIssuesMock';
import { syncRedmineUserIssuesReqBodyMock } from '../mocks/syncRedmineUserIssuesRequestMock';
import { userIssueMock } from '../mocks/userIssueMock';
import JiraService from '../../services/jira.service';
import { jiraIssuesMock, jiraIssuesProcessedMock } from '../mocks/jiraIssuesMock';
import IUserIssue from '../../interfaces/IUserIssue';
import IEvidence from '../../interfaces/IEvidence';
import { MONTHS } from '../../resources/configurations/constants/Months';
import IIssueDescription from '../../interfaces/IIssueDescription';
import { Paragraph } from 'docx';
import puppeteer from 'puppeteer';
import ICreateTemplateInput from '../../interfaces/ICreateTemplateInput';
import { createTemplateResponseMock } from '../mocks/createTemplateResponseMock';
import { getEvidenceInfoMock } from '../mocks/evidenceDescriptionResponseMock';

const redmineIssue = redmineIssuesMock.issues[0];

const userIssueFromDBMock = new UserIssueModel(userIssueMock);

describe('UserIssueService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getInstance method', () => {
        it('should return the same jira service instance', () => {
            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const userIssueService2 = UserIssueService.getInstance();
            expect(userIssueService).toBeInstanceOf(UserIssueService);
            expect(userIssueService).toStrictEqual(userIssueService2);
        });
    });

    describe('createUserIssue method', () => {
        it('should create an user issue if it does no exist', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue(null as any);
            const createMock = jest.spyOn(mongooseModel, 'create').mockImplementation(async () => userIssueMock as any);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.createUserIssue({
                ...redmineIssue,
                assigned_to: {
                    name: undefined,
                    id: undefined,
                },
            });

            const expectedResult = new UserIssueModel({
                id: redmineIssue.id,
                key: redmineIssue.id,
                self: `${process.env.REDMINE_BASE_URL}/issues/${redmineIssue.id}`,
                type: redmineIssue.tracker.name,
                created: redmineIssue.created_on,
                updated: redmineIssue.updated_on,
                closed: redmineIssue.closed_on,
                assignee: '',
                assignedToId: '',
                status: redmineIssue.status.name,
                description: redmineIssue.subject,
                summary: redmineIssue.description,
                project: redmineIssue.project.name,
                projectTypeKey: redmineIssue.project.id,
                creator: redmineIssue.author.name,
                reporter: redmineIssue.author.name,
                pageType: PageTypeEnum.REDMINE,
            }).getProperties();

            expect(result).toStrictEqual(expectedResult);
            expect(findOneMock).toHaveBeenCalledTimes(1);
            expect(createMock).toHaveBeenCalledTimes(1);
        });

        it('should update an user issue if it do exist', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue({ ...userIssueMock, save: async () => userIssueMock } as any);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.createUserIssue(redmineIssue);

            const expectedResult = userIssueFromDBMock.getProperties();

            expect(result).toStrictEqual(expectedResult);
            expect(findOneMock).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if findOne fails', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockImplementation((async () => {
                throw new Error('findOne error');
            }) as any);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.createUserIssue(redmineIssue)).rejects.toThrow('findOne error');
            expect(findOneMock).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if save fails', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue({
                ...userIssueMock,
                save: async () => {
                    throw new Error('save error');
                },
            } as any);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.createUserIssue(redmineIssue)).rejects.toThrow('save error');
            expect(findOneMock).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if create fails', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue(null as any);
            const createMock = jest.spyOn(mongooseModel, 'create').mockImplementation((async () => {
                throw new Error('create error');
            }) as any);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.createUserIssue(redmineIssue)).rejects.toThrow('create error');
            expect(findOneMock).toHaveBeenCalledTimes(1);
            expect(createMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getIssuesFromRedmineAndSave method', () => {
        it('should get issues from redmine and save them successfully', async () => {
            const redmineService = RedmineService.getInstance();
            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const redmineGetUserIssuesMock = jest.spyOn(redmineService, 'getUserIssues').mockReturnValue(redmineIssuesMock as any);
            const createUserIssueMock = jest.spyOn(userIssueService, 'createUserIssue').mockReturnValue(userIssueFromDBMock as any);

            const request: IGetIssueFromRedmineInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                status_id: syncRedmineUserIssuesReqBodyMock.status_id,
                limit: syncRedmineUserIssuesReqBodyMock.limit,
                offset: syncRedmineUserIssuesReqBodyMock.offset,
            };
            const result = await userIssueService.getIssuesFromRedmineAndSave(request);

            expect(result).toHaveProperty('createdRegisters', 3);
            expect(redmineGetUserIssuesMock).toHaveBeenCalledTimes(1);
            expect(createUserIssueMock).toHaveBeenCalledTimes(3);
        });

        it('should continue if an error occurs when try to save', async () => {
            const redmineService = RedmineService.getInstance();
            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const redmineGetUserIssuesMock = jest.spyOn(redmineService, 'getUserIssues').mockReturnValue(redmineIssuesMock as any);
            const createUserIssueMock = jest
                .spyOn(userIssueService, 'createUserIssue')
                .mockReturnValue(userIssueFromDBMock as any)
                .mockImplementationOnce((() => {
                    throw new Error('error creating user issue');
                }) as any);

            const request: IGetIssueFromRedmineInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                status_id: syncRedmineUserIssuesReqBodyMock.status_id,
                limit: syncRedmineUserIssuesReqBodyMock.limit,
                offset: syncRedmineUserIssuesReqBodyMock.offset,
            };
            const result = await userIssueService.getIssuesFromRedmineAndSave(request);

            expect(result).toHaveProperty('createdRegisters', 2);
            expect(redmineGetUserIssuesMock).toHaveBeenCalledTimes(1);
            expect(createUserIssueMock).toHaveBeenCalledTimes(3);
        });

        it('should throw error if an error occurs when try to getting the user issues from redmine', async () => {
            const redmineService = RedmineService.getInstance();
            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const redmineGetUserIssuesMock = jest.spyOn(redmineService, 'getUserIssues').mockImplementationOnce((() => {
                throw new Error('error getting user issue');
            }) as any);

            const request: IGetIssueFromRedmineInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                status_id: syncRedmineUserIssuesReqBodyMock.status_id,
                limit: syncRedmineUserIssuesReqBodyMock.limit,
                offset: syncRedmineUserIssuesReqBodyMock.offset,
            };

            await expect(userIssueService.getIssuesFromRedmineAndSave(request)).rejects.toThrow('error getting user issue');
            expect(redmineGetUserIssuesMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('syncRedmineUserIssues method', () => {
        it('should get issues from redmine and save them successfully', async () => {
            const redmineService = RedmineService.getInstance();
            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const redmineGetUserIssuesMock = jest.spyOn(redmineService, 'getUserIssues').mockReturnValue(redmineIssuesMock as any);
            const createUserIssueMock = jest.spyOn(userIssueService, 'createUserIssue').mockReturnValue(userIssueFromDBMock as any);

            const request: IGetIssueFromRedmineInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                status_id: syncRedmineUserIssuesReqBodyMock.status_id,
                limit: syncRedmineUserIssuesReqBodyMock.limit,
                offset: syncRedmineUserIssuesReqBodyMock.offset,
            };
            const result = await userIssueService.syncRedmineUserIssues(request);

            expect(result).toHaveProperty('createdRegisters', 3);
            expect(result).toHaveProperty('time');
            expect(redmineGetUserIssuesMock).toHaveBeenCalledTimes(1);
            expect(createUserIssueMock).toHaveBeenCalledTimes(3);
        });

        it('should get issues from redmine and save them successfully with pagination mechanism', async () => {
            const redmineService = RedmineService.getInstance();
            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const redmineGetUserIssuesMock = jest.spyOn(redmineService, 'getUserIssues').mockReturnValue({
                issues: [redmineIssue],
                total_count: 3,
                limit: 1,
                offset: 0,
            } as any);
            const createUserIssueMock = jest.spyOn(userIssueService, 'createUserIssue').mockReturnValue(userIssueFromDBMock as any);

            const request: IGetIssueFromRedmineInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                status_id: syncRedmineUserIssuesReqBodyMock.status_id,
                limit: 1,
                offset: syncRedmineUserIssuesReqBodyMock.offset,
            };
            const result = await userIssueService.syncRedmineUserIssues(request);

            expect(result).toHaveProperty('createdRegisters', 3);
            expect(result).toHaveProperty('time');
            expect(redmineGetUserIssuesMock).toHaveBeenCalledTimes(3);
            expect(createUserIssueMock).toHaveBeenCalledTimes(3);
        });

        it('should throw error if an error occurs when try to getting the user issues from redmine', async () => {
            const redmineService = RedmineService.getInstance();
            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const redmineGetUserIssuesMock = jest.spyOn(redmineService, 'getUserIssues').mockImplementationOnce((() => {
                throw new Error('error getting user issue');
            }) as any);

            const request: IGetIssueFromRedmineInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                status_id: syncRedmineUserIssuesReqBodyMock.status_id,
                limit: syncRedmineUserIssuesReqBodyMock.limit,
                offset: syncRedmineUserIssuesReqBodyMock.offset,
            };

            await expect(userIssueService.syncRedmineUserIssues(request)).rejects.toThrow('error getting user issue');
            expect(redmineGetUserIssuesMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getDbUserIssues method', () => {
        it('should get issues from db', async () => {
            const findMock = jest.spyOn(mongooseModel, 'find').mockReturnValue({
                sort: () => userIssueFromDBMock.getProperties(),
            } as any);

            const assignedToId: number = 1;
            const startDate: Date = new Date('2024-11-01');
            const endDate: Date = new Date('2024-11-30');

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.getDbUserIssues(assignedToId, startDate, endDate);

            expect(result).toMatchObject(userIssueFromDBMock.getProperties());
            expect(findMock).toHaveBeenCalledTimes(1);
        });

        it('should return null if finds nothing', async () => {
            const findMock = jest.spyOn(mongooseModel, 'find').mockReturnValue({
                sort: () => null,
            } as any);

            const assignedToId: number = 1;
            const startDate: Date = new Date('2024-11-01');
            const endDate: Date = new Date('2024-11-30');

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.getDbUserIssues(assignedToId, startDate, endDate);

            expect(result).toBe(null);
            expect(findMock).toHaveBeenCalledTimes(1);
        });

        it('should throw error if find throws error', async () => {
            const findMock = jest.spyOn(mongooseModel, 'find').mockReturnValue({
                sort: () => {
                    throw new Error('error finding db user issues');
                },
            } as any);

            const assignedToId: number = 1;
            const startDate: Date = new Date('2024-11-01');
            const endDate: Date = new Date('2024-11-30');

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.getDbUserIssues(assignedToId, startDate, endDate)).rejects.toThrow('error finding db user issues');
            expect(findMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getUserIssues method', () => {
        it('should call jira service if jira_username is defined in the request', async () => {
            const jiraService: JiraService = JiraService.getInstance();

            const jiraServiceGetUserIssuesMock = jest.spyOn(jiraService, 'getUserIssues').mockImplementation((async () => jiraIssuesMock) as any);

            const request: IUserIssuesInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.getUserIssues(request);
            const expectedResult: IDataIssue = jiraIssuesProcessedMock();

            expect(result).toMatchObject(expectedResult);
            expect(jiraServiceGetUserIssuesMock).toHaveBeenCalledTimes(1);
        });

        it('should call jira service if jira_username is defined in the request and other jira params', async () => {
            const jiraService: JiraService = JiraService.getInstance();

            const jiraServiceGetUserIssuesMock = jest.spyOn(jiraService, 'getUserIssues').mockImplementation((async () => jiraIssuesMock) as any);

            const request: IUserIssuesInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                jira_base_url: getUserIssueReqBodyMock.jira_base_url,
                jira_url: getUserIssueReqBodyMock.jira_url,
                jql: getUserIssueReqBodyMock.jql,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.getUserIssues(request);
            const expectedResult: IDataIssue = jiraIssuesProcessedMock(request.jira_base_url);

            expect(result).toMatchObject(expectedResult);
            expect(jiraServiceGetUserIssuesMock).toHaveBeenCalledTimes(1);
        });

        it('should call get user issues from db service if redmine_id is defined in the request', async () => {
            const request: IUserIssuesInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const issuesMock: IUserIssue[] = [userIssueMock, userIssueMock, userIssueMock];

            const getDbUserIssuesMock = jest.spyOn(userIssueService, 'getDbUserIssues').mockImplementation((async () => issuesMock) as any);

            const result = await userIssueService.getUserIssues(request);

            const expectedResult: IDataIssue = {
                month: 'Noviembre',
                total: 3,
                userDisplayName: 'Adrián López Varela',
                project: 'Integraciones',
                issues: issuesMock,
            };

            expect(result).toMatchObject(expectedResult);
            expect(getDbUserIssuesMock).toHaveBeenCalledTimes(1);
        });

        it('should handle full request', async () => {
            const jiraService: JiraService = JiraService.getInstance();

            const jiraServiceGetUserIssuesMock = jest.spyOn(jiraService, 'getUserIssues').mockImplementation((async () => jiraIssuesMock) as any);

            const request: IUserIssuesInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                jira_base_url: getUserIssueReqBodyMock.jira_base_url,
                jira_url: getUserIssueReqBodyMock.jira_url,
                jql: getUserIssueReqBodyMock.jql,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const issuesMock: IUserIssue[] = [userIssueMock, userIssueMock, userIssueMock];
            const getDbUserIssuesMock = jest.spyOn(userIssueService, 'getDbUserIssues').mockImplementation((async () => issuesMock) as any);

            const result = await userIssueService.getUserIssues(request);
            const expectedResult: IDataIssue = jiraIssuesProcessedMock(request.jira_base_url);
            expectedResult.issues = expectedResult.issues.concat(issuesMock);
            expectedResult.total = 6;

            expect(result).toMatchObject(expectedResult);
            expect(jiraServiceGetUserIssuesMock).toHaveBeenCalledTimes(1);
            expect(getDbUserIssuesMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getUserIssuesDescriptions method', () => {
        it('should call jira service if jira_username is defined in the request', async () => {
            const jiraService: JiraService = JiraService.getInstance();
            const jiraServiceGetUserIssuesMock = jest.spyOn(jiraService, 'getUserIssues').mockImplementation((async () => jiraIssuesMock) as any);

            const request: IUserIssuesInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const result = await userIssueService.getUserIssuesDescriptions(request);

            const issuesDescriptionsMock: IIssueDescription[] = [];

            const getIssuesResultMock: IDataIssue = jiraIssuesProcessedMock();
            getIssuesResultMock.issues.forEach((issue: IUserIssue) => {
                const title: string = `${issue.type} #${issue.key}: `;
                const summary: string = UserIssueService.getIssueSummary(issue);
                const link: string = issue.self;

                issuesDescriptionsMock.push({
                    title,
                    summary,
                    link,
                    pageType: issue.pageType,
                    closed: issue.closed!,
                    project: issue.project,
                });
            });

            const expectedResult: IEvidence = {
                project: getIssuesResultMock.project,
                userDisplayName: getIssuesResultMock.userDisplayName,
                date: `${MONTHS(request.year)[request.month - 1].days}/${request.month}/${request.year}`,
                month: getIssuesResultMock.month.toUpperCase(),
                evidenceStart: 'En el mes de Noviembre de 2024 se realizaron las siguientes tareas por Jhon Doe: ',
                total: 3,
                issues: issuesDescriptionsMock,
            };

            expect(result).toMatchObject(expectedResult);
            expect(jiraServiceGetUserIssuesMock).toHaveBeenCalledTimes(1);
        });

        it('should call jira service if jira_username is defined in the request and other jira params', async () => {
            const jiraService: JiraService = JiraService.getInstance();
            const jiraServiceGetUserIssuesMock = jest.spyOn(jiraService, 'getUserIssues').mockImplementation((async () => jiraIssuesMock) as any);

            const request: IUserIssuesInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                jira_base_url: getUserIssueReqBodyMock.jira_base_url,
                jira_url: getUserIssueReqBodyMock.jira_url,
                jql: getUserIssueReqBodyMock.jql,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const result = await userIssueService.getUserIssuesDescriptions(request);

            const issuesDescriptionsMock: IIssueDescription[] = [];

            const getIssuesResultMock: IDataIssue = jiraIssuesProcessedMock(request.jira_base_url);
            getIssuesResultMock.issues.forEach((issue: IUserIssue) => {
                const title: string = `${issue.type} #${issue.key}: `;
                const summary: string = UserIssueService.getIssueSummary(issue);
                const link: string = issue.self;

                issuesDescriptionsMock.push({
                    title,
                    summary,
                    link,
                    pageType: issue.pageType,
                    closed: issue.closed!,
                    project: issue.project,
                });
            });
            const expectedResult: IEvidence = {
                project: getIssuesResultMock.project,
                userDisplayName: getIssuesResultMock.userDisplayName,
                date: `${MONTHS(request.year)[request.month - 1].days}/${request.month}/${request.year}`,
                month: getIssuesResultMock.month.toUpperCase(),
                evidenceStart: 'En el mes de Noviembre de 2024 se realizaron las siguientes tareas por Jhon Doe: ',
                total: 3,
                issues: issuesDescriptionsMock,
            };

            expect(result).toMatchObject(expectedResult);
            expect(jiraServiceGetUserIssuesMock).toHaveBeenCalledTimes(1);
        });

        it('should call get user issues from db service if redmine_id is defined in the request', async () => {
            const request: IUserIssuesInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const result = await userIssueService.getUserIssuesDescriptions(request);

            const issuesDescriptionsMock: IIssueDescription[] = [];

            const issuesMock: IUserIssue[] = [userIssueMock, userIssueMock, userIssueMock];
            const getDbUserIssuesMock = jest.spyOn(userIssueService, 'getDbUserIssues').mockImplementation((async () => issuesMock) as any);
            const getIssuesResultMock: IDataIssue = {
                month: 'Noviembre',
                total: 3,
                userDisplayName: 'Adrián López Varela',
                project: 'Integraciones',
                issues: issuesMock,
            };
            getIssuesResultMock.issues.forEach((issue: IUserIssue) => {
                const title: string = `${issue.type} #${issue.key}: `;
                const summary: string = UserIssueService.getIssueSummary(issue);
                const link: string = issue.self;

                issuesDescriptionsMock.push({
                    title,
                    summary,
                    link,
                    pageType: issue.pageType,
                    closed: issue.closed!,
                    project: issue.project,
                });
            });

            const expectedResult: IEvidence = {
                project: getIssuesResultMock.project,
                userDisplayName: getIssuesResultMock.userDisplayName,
                date: `${MONTHS(request.year)[request.month - 1].days}/${request.month}/${request.year}`,
                month: getIssuesResultMock.month.toUpperCase(),
                evidenceStart: 'En el mes de Noviembre de 2024 se realizaron las siguientes tareas por Adrián López Varela: ',
                total: 3,
                issues: issuesDescriptionsMock,
            };

            expect(result).toMatchObject(expectedResult);
            expect(getDbUserIssuesMock).toHaveBeenCalledTimes(1);
        });

        it('should handle full request', async () => {
            const jiraService: JiraService = JiraService.getInstance();
            const jiraServiceGetUserIssuesMock = jest.spyOn(jiraService, 'getUserIssues').mockImplementation((async () => jiraIssuesMock) as any);

            const request: IUserIssuesInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                jira_base_url: getUserIssueReqBodyMock.jira_base_url,
                jira_url: getUserIssueReqBodyMock.jira_url,
                jql: getUserIssueReqBodyMock.jql,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const result = await userIssueService.getUserIssuesDescriptions(request);

            const issuesMock: IUserIssue[] = [userIssueMock, userIssueMock, userIssueMock];

            const getDbUserIssuesMock = jest.spyOn(userIssueService, 'getDbUserIssues').mockImplementation((async () => issuesMock) as any);

            const expectedResult: IEvidence = getEvidenceInfoMock(issuesMock, request);

            expect(result).toMatchObject(expectedResult);
            expect(jiraServiceGetUserIssuesMock).toHaveBeenCalledTimes(1);
            expect(getDbUserIssuesMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('takeScreenshot', () => {
        it('should take screenshot when issue is from jira', async () => {
            const evidenceInfoMock: IEvidence = getEvidenceInfoMock([]);

            const issue: IIssueDescription = evidenceInfoMock.issues![0];

            const pageMock = {
                setViewport: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                goto: jest.fn().mockImplementation((_url) => {
                    return Promise.resolve();
                }),
                screenshot: jest.fn().mockImplementation(() => {
                    return Promise.resolve(Buffer.from(''));
                }),
                waitForSelector: jest.fn().mockImplementation((_selector) => {
                    return Promise.resolve();
                }),
                type: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                focus: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                click: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                waitForNavigation: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                evaluate: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                close: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
            };

            const browserLaunchMock = {
                newPage() {
                    return Promise.resolve(pageMock);
                },
            } as any;

            const isLogin: boolean = true;
            const authorization: string = getUserIssueReqHeaderMock.authorization;

            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const result = await userIssueService.takeScreenshot(issue, browserLaunchMock, isLogin, authorization);

            expect(result).toBeInstanceOf(Buffer);
            expect(pageMock.setViewport).toHaveBeenCalledTimes(1);
            expect(pageMock.goto).toHaveBeenCalledTimes(1);
            expect(pageMock.screenshot).toHaveBeenCalledTimes(1);
            expect(pageMock.waitForSelector).toHaveBeenCalledTimes(0);
            expect(pageMock.type).toHaveBeenCalledTimes(2);
            expect(pageMock.focus).toHaveBeenCalledTimes(1);
            expect(pageMock.click).toHaveBeenCalledTimes(1);
            expect(pageMock.waitForNavigation).toHaveBeenCalledTimes(1);
            expect(pageMock.evaluate).toHaveBeenCalledTimes(1);
            expect(pageMock.close).toHaveBeenCalledTimes(1);
        });

        it('should take screenshot when issue is from redmine', async () => {
            const evidenceInfoMock: IEvidence = getEvidenceInfoMock([userIssueMock, userIssueMock, userIssueMock]);

            const issue: IIssueDescription = evidenceInfoMock.issues![3];

            const pageMock = {
                setViewport: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                goto: jest.fn().mockImplementation((_url) => {
                    return Promise.resolve();
                }),
                screenshot: jest.fn().mockImplementation(() => {
                    return Promise.resolve(Buffer.from(''));
                }),
                waitForSelector: jest.fn().mockImplementation((_selector) => {
                    return Promise.resolve();
                }),
                type: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                focus: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                click: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                waitForNavigation: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                evaluate: jest.fn().mockImplementation((_fn) => {
                    return Promise.resolve();
                }),
                close: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
            };

            const browserLaunchMock = {
                newPage() {
                    return Promise.resolve(pageMock);
                },
            } as any;

            const isLogin: boolean = true;
            const authorization: string = getUserIssueReqHeaderMock.authorization;

            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const result = await userIssueService.takeScreenshot(issue, browserLaunchMock, isLogin, authorization);

            expect(result).toBeInstanceOf(Buffer);
            expect(pageMock.setViewport).toHaveBeenCalledTimes(1);
            expect(pageMock.goto).toHaveBeenCalledTimes(1);
            expect(pageMock.screenshot).toHaveBeenCalledTimes(1);
            expect(pageMock.waitForSelector).toHaveBeenCalledTimes(0);
            expect(pageMock.type).toHaveBeenCalledTimes(2);
            expect(pageMock.focus).toHaveBeenCalledTimes(1);
            expect(pageMock.click).toHaveBeenCalledTimes(1);
            expect(pageMock.waitForNavigation).toHaveBeenCalledTimes(1);
            expect(pageMock.evaluate).toHaveBeenCalledTimes(1);
            expect(pageMock.close).toHaveBeenCalledTimes(1);
        });
    });

    describe('getEvidenceImages', () => {
        it('should return an array of paragraphs with the taken screenshots of jira', async () => {
            const evidenceInfoMock: IEvidence = getEvidenceInfoMock([]);
            const request = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const takeScreenshotMock = jest.spyOn(userIssueService, 'takeScreenshot').mockImplementation(async () => Buffer.from(''));
            const launchBrowserMock = jest.spyOn(puppeteer, 'launch').mockImplementation(
                async (_options) =>
                    ({
                        close: async () => {},
                    }) as any,
            );

            const result = await userIssueService.getEvidenceImages(evidenceInfoMock, request);

            expect(result[0]).toBeInstanceOf(Paragraph);
            expect(takeScreenshotMock).toHaveBeenCalledTimes(3);
            expect(launchBrowserMock).toHaveBeenCalledTimes(1);
        });

        it('should return an array of paragraphs with the taken screenshots of redmine', async () => {
            const pageMock = {
                setViewport: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
                goto: jest.fn().mockImplementation((_url) => {
                    return Promise.resolve();
                }),
                waitForSelector: jest.fn().mockImplementation((_selector) => {
                    return Promise.resolve({
                        screenshot: () => '',
                    });
                }),
                close: jest.fn().mockImplementation(() => {
                    return Promise.resolve();
                }),
            };

            const evidenceInfoMock: IEvidence = getEvidenceInfoMock([userIssueMock, userIssueMock, userIssueMock], undefined, false);
            const request = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const takeScreenshotMock = jest.spyOn(userIssueService, 'takeScreenshot').mockImplementation(async () => Buffer.from(''));
            const launchBrowserMock = jest.spyOn(puppeteer, 'launch').mockImplementation(
                async (_options) =>
                    ({
                        close: async () => {},
                        newPage: async () => pageMock,
                    }) as any,
            );

            const result = await userIssueService.getEvidenceImages(evidenceInfoMock, request);

            expect(result[0]).toBeInstanceOf(Paragraph);
            expect(takeScreenshotMock).toHaveBeenCalledTimes(3);
            expect(launchBrowserMock).toHaveBeenCalledTimes(1);
            expect(pageMock.setViewport).toHaveBeenCalledTimes(1);
            expect(pageMock.goto).toHaveBeenCalledTimes(1);
            expect(pageMock.waitForSelector).toHaveBeenCalledTimes(1);
            expect(pageMock.close).toHaveBeenCalledTimes(1);
        });

        it('should continue taking screenshots even if one throws error', async () => {
            const evidenceInfoMock: IEvidence = getEvidenceInfoMock([]);
            const request = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const takeScreenshotMock = jest
                .spyOn(userIssueService, 'takeScreenshot')
                .mockImplementationOnce(async () => {
                    throw new Error('error getting screenshot');
                })
                .mockImplementation(async () => Buffer.from(''));
            const launchBrowserMock = jest.spyOn(puppeteer, 'launch').mockImplementation(
                async (_options) =>
                    ({
                        close: async () => {},
                    }) as any,
            );

            const result = await userIssueService.getEvidenceImages(evidenceInfoMock, request);

            expect(result[0]).toBeInstanceOf(Paragraph);
            expect(takeScreenshotMock).toHaveBeenCalledTimes(3);
            expect(launchBrowserMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('createTemplate', () => {
        it('should return and empty array of issues if the user has not evidences', async () => {
            const request: ICreateTemplateInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getEvidenceImagesMock = jest.spyOn(userIssueService, 'getEvidenceImages').mockImplementation(async () => []);

            const getUserIssuesDescriptionsMock = jest.spyOn(userIssueService, 'getUserIssuesDescriptions').mockImplementation(async () => getEvidenceInfoMock([], request, false));

            const result = await userIssueService.createTemplate(request);

            expect(result).toHaveProperty('project', 'Project Name Test');
            expect(result).toHaveProperty('userDisplayName', 'Jhon Doe');
            expect(result).toHaveProperty('date', '30/11/2024');
            expect(result).toHaveProperty('month', 'NOVIEMBRE');
            expect(result).toHaveProperty('evidenceStart', 'En el mes de Noviembre de 2024 se realizaron las siguientes tareas por Jhon Doe: ');
            expect(result).toHaveProperty('total', 0);
            expect(result.issues?.length).toBe(0);

            expect(result.path).toBeUndefined();

            expect(getUserIssuesDescriptionsMock).toHaveBeenCalledTimes(1);
            expect(getEvidenceImagesMock).toHaveBeenCalledTimes(0);
        });

        it('should create a new folder for the year if it does no exist and the evidences files too', async () => {
            const fsExistsSyncMock = jest
                .spyOn(fs, 'existsSync')
                .mockImplementationOnce((_pathName) => false) // exist the folder of the year?
                .mockImplementationOnce((_pathName) => false); // exist the file of evidences?

            const fsMkdirSync = jest.spyOn(fs, 'mkdirSync').mockImplementationOnce((_pathName, _options) => ''); // creates the folder of the year if does not exist

            const fsWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation((_pathName, _options) => ''); // creates the file

            const request: ICreateTemplateInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getEvidenceImagesMock = jest.spyOn(userIssueService, 'getEvidenceImages').mockImplementation(async () => []);

            const getUserIssuesDescriptionsMock = jest.spyOn(userIssueService, 'getUserIssuesDescriptions').mockImplementation(async () => getEvidenceInfoMock([], request));

            const result = await userIssueService.createTemplate(request);

            expect(result).toHaveProperty('project', 'Project Name Test');
            expect(result).toHaveProperty('userDisplayName', 'Jhon Doe');
            expect(result).toHaveProperty('date', '30/11/2024');
            expect(result).toHaveProperty('month', 'NOVIEMBRE');
            expect(result).toHaveProperty('evidenceStart', 'En el mes de Noviembre de 2024 se realizaron las siguientes tareas por Jhon Doe: ');
            expect(result).toHaveProperty('total', 3);
            expect(result.issues?.length).toBe(3);
            expect(result).toHaveProperty('path');

            const includesTheWords: boolean = ['templates', 'EVIDENCIAS 2024', 'Jhon Doe', 'NOVIEMBRE', 'Plantilla Evidencias - noviembre.docx'].every((word) =>
                result.path?.includes(word),
            );
            expect(includesTheWords).toBe(true);

            expect(getUserIssuesDescriptionsMock).toHaveBeenCalledTimes(1);
            expect(getEvidenceImagesMock).toHaveBeenCalledTimes(1);

            expect(fsExistsSyncMock).toHaveBeenCalledTimes(2);
            expect(fsMkdirSync).toHaveBeenCalledTimes(1);
            expect(fsWriteFileSync).toHaveBeenCalledTimes(1);
        });

        it('should return only the template info if evidence files already exists and rewrite files request is false', async () => {
            const fsExistsSyncMock = jest
                .spyOn(fs, 'existsSync')
                .mockImplementationOnce((_pathName) => true) // exist the folder of the year?
                .mockImplementationOnce((_pathName) => true); // exist the file of evidences?

            const request: ICreateTemplateInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getUserIssuesDescriptionsMock = jest.spyOn(userIssueService, 'getUserIssuesDescriptions').mockImplementation(async () => getEvidenceInfoMock([], request));

            const result = await userIssueService.createTemplate(request);

            expect(result).toHaveProperty('project', 'Project Name Test');
            expect(result).toHaveProperty('userDisplayName', 'Jhon Doe');
            expect(result).toHaveProperty('date', '30/11/2024');
            expect(result).toHaveProperty('month', 'NOVIEMBRE');
            expect(result).toHaveProperty('evidenceStart', 'En el mes de Noviembre de 2024 se realizaron las siguientes tareas por Jhon Doe: ');
            expect(result).toHaveProperty('total', 3);
            expect(result.issues?.length).toBe(3);
            expect(result).toHaveProperty('path');

            const includesTheWords: boolean = ['templates', 'EVIDENCIAS 2024', 'Jhon Doe', 'NOVIEMBRE', 'Plantilla Evidencias - noviembre.docx'].every((word) =>
                result.path?.includes(word),
            );
            expect(includesTheWords).toBe(true);

            expect(getUserIssuesDescriptionsMock).toHaveBeenCalledTimes(1);

            expect(fsExistsSyncMock).toHaveBeenCalledTimes(2);
        });

        it('should delete and create again the evidence document if evidence files already exists and rewrite files request is true', async () => {
            const fsExistsSyncMock = jest
                .spyOn(fs, 'existsSync')
                .mockImplementationOnce((_pathName) => true) // exist the folder of the year?
                .mockImplementationOnce((_pathName) => true); // exist the file of evidences?

            const fsRmSync = jest.spyOn(fs, 'rmSync').mockImplementationOnce((_pathName) => {}); // remove file if exists and rewrite is true

            const fsWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation((_pathName, _options) => ''); // creates the file

            const request: ICreateTemplateInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                rewrite_files: true,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getEvidenceImagesMock = jest.spyOn(userIssueService, 'getEvidenceImages').mockImplementation(async () => []);

            const getUserIssuesDescriptionsMock = jest.spyOn(userIssueService, 'getUserIssuesDescriptions').mockImplementation(async () => getEvidenceInfoMock([], request));

            const result = await userIssueService.createTemplate(request);

            expect(result).toHaveProperty('project', 'Project Name Test');
            expect(result).toHaveProperty('userDisplayName', 'Jhon Doe');
            expect(result).toHaveProperty('date', '30/11/2024');
            expect(result).toHaveProperty('month', 'NOVIEMBRE');
            expect(result).toHaveProperty('evidenceStart', 'En el mes de Noviembre de 2024 se realizaron las siguientes tareas por Jhon Doe: ');
            expect(result).toHaveProperty('total', 3);
            expect(result.issues?.length).toBe(3);
            expect(result).toHaveProperty('path');

            const includesTheWords: boolean = ['templates', 'EVIDENCIAS 2024', 'Jhon Doe', 'NOVIEMBRE', 'Plantilla Evidencias - noviembre.docx'].every((word) =>
                result.path?.includes(word),
            );
            expect(includesTheWords).toBe(true);

            expect(getUserIssuesDescriptionsMock).toHaveBeenCalledTimes(1);
            expect(getEvidenceImagesMock).toHaveBeenCalledTimes(1);

            expect(fsExistsSyncMock).toHaveBeenCalledTimes(2);
            expect(fsRmSync).toHaveBeenCalledTimes(1);
            expect(fsWriteFileSync).toHaveBeenCalledTimes(1);
        });

        it('should handle request with redmine_id only', async () => {
            const fsExistsSyncMock = jest
                .spyOn(fs, 'existsSync')
                .mockImplementationOnce((_pathName) => true) // exist the folder of the year?
                .mockImplementationOnce((_pathName) => true); // exist the file of evidences?

            const fsRmSync = jest.spyOn(fs, 'rmSync').mockImplementationOnce((_pathName) => {}); // remove file if exists and rewrite is true

            const fsWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation((_pathName, _options) => ''); // creates the file

            const request: ICreateTemplateInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                rewrite_files: true,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getEvidenceImagesMock = jest.spyOn(userIssueService, 'getEvidenceImages').mockImplementation(async () => []);

            const getUserIssuesDescriptionsMock = jest
                .spyOn(userIssueService, 'getUserIssuesDescriptions')
                .mockImplementation(async () => getEvidenceInfoMock([userIssueMock, userIssueMock, userIssueMock], request, false));

            const result = await userIssueService.createTemplate(request);

            expect(result).toHaveProperty('project', 'Project Name Test');
            expect(result).toHaveProperty('userDisplayName', 'Jhon Doe');
            expect(result).toHaveProperty('date', '30/11/2024');
            expect(result).toHaveProperty('month', 'NOVIEMBRE');
            expect(result).toHaveProperty('evidenceStart', 'En el mes de Noviembre de 2024 se realizaron las siguientes tareas por Jhon Doe: ');
            expect(result).toHaveProperty('total', 3);
            expect(result.issues?.length).toBe(3);
            expect(result).toHaveProperty('path');

            const includesTheWords: boolean = ['templates', 'EVIDENCIAS 2024', 'Jhon Doe', 'NOVIEMBRE', 'Plantilla Evidencias - noviembre.docx'].every((word) =>
                result.path?.includes(word),
            );
            expect(includesTheWords).toBe(true);

            expect(getUserIssuesDescriptionsMock).toHaveBeenCalledTimes(1);
            expect(getEvidenceImagesMock).toHaveBeenCalledTimes(1);

            expect(fsExistsSyncMock).toHaveBeenCalledTimes(2);
            expect(fsRmSync).toHaveBeenCalledTimes(1);
            expect(fsWriteFileSync).toHaveBeenCalledTimes(1);
        });

        it('should handle request with redmine_id and jira_username', async () => {
            const fsExistsSyncMock = jest
                .spyOn(fs, 'existsSync')
                .mockImplementationOnce((_pathName) => true) // exist the folder of the year?
                .mockImplementationOnce((_pathName) => true); // exist the file of evidences?

            const fsRmSync = jest.spyOn(fs, 'rmSync').mockImplementationOnce((_pathName) => {}); // remove file if exists and rewrite is true

            const fsWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation((_pathName, _options) => ''); // creates the file

            const request: ICreateTemplateInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                rewrite_files: true,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getEvidenceImagesMock = jest.spyOn(userIssueService, 'getEvidenceImages').mockImplementation(async () => []);

            const getUserIssuesDescriptionsMock = jest
                .spyOn(userIssueService, 'getUserIssuesDescriptions')
                .mockImplementation(async () => getEvidenceInfoMock([userIssueMock, userIssueMock, userIssueMock], request));

            const result = await userIssueService.createTemplate(request);

            expect(result).toHaveProperty('project', 'Project Name Test');
            expect(result).toHaveProperty('userDisplayName', 'Jhon Doe');
            expect(result).toHaveProperty('date', '30/11/2024');
            expect(result).toHaveProperty('month', 'NOVIEMBRE');
            expect(result).toHaveProperty('evidenceStart', 'En el mes de Noviembre de 2024 se realizaron las siguientes tareas por Jhon Doe: ');
            expect(result).toHaveProperty('total', 6);
            expect(result.issues?.length).toBe(6);
            expect(result).toHaveProperty('path');

            const includesTheWords: boolean = ['templates', 'EVIDENCIAS 2024', 'Jhon Doe', 'NOVIEMBRE', 'Plantilla Evidencias - noviembre.docx'].every((word) =>
                result.path?.includes(word),
            );
            expect(includesTheWords).toBe(true);

            expect(getUserIssuesDescriptionsMock).toHaveBeenCalledTimes(1);
            expect(getEvidenceImagesMock).toHaveBeenCalledTimes(2);

            expect(fsExistsSyncMock).toHaveBeenCalledTimes(2);
            expect(fsRmSync).toHaveBeenCalledTimes(1);
            expect(fsWriteFileSync).toHaveBeenCalledTimes(1);
        });

        it('should handle request with jira_base_url', async () => {
            const fsExistsSyncMock = jest
                .spyOn(fs, 'existsSync')
                .mockImplementationOnce((_pathName) => true) // exist the folder of the year?
                .mockImplementationOnce((_pathName) => true); // exist the file of evidences?

            const fsRmSync = jest.spyOn(fs, 'rmSync').mockImplementationOnce((_pathName) => {}); // remove file if exists and rewrite is true

            const fsWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation((_pathName, _options) => ''); // creates the file

            const request: ICreateTemplateInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                jira_base_url: getUserIssueReqBodyMock.jira_base_url,
                jira_url: getUserIssueReqBodyMock.jira_url,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                rewrite_files: true,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getUserIssuesDescriptionsMock = jest.spyOn(userIssueService, 'getUserIssuesDescriptions').mockImplementation(async () => getEvidenceInfoMock([], request));

            const result = await userIssueService.createTemplate(request);

            expect(result).toHaveProperty('project', 'Project Name Test');
            expect(result).toHaveProperty('userDisplayName', 'Jhon Doe');
            expect(result).toHaveProperty('date', '30/11/2024');
            expect(result).toHaveProperty('month', 'NOVIEMBRE');
            expect(result).toHaveProperty('evidenceStart', 'En el mes de Noviembre de 2024 se realizaron las siguientes tareas por Jhon Doe: ');
            expect(result).toHaveProperty('total', 3);
            expect(result.issues?.length).toBe(3);
            expect(result).toHaveProperty('path');

            const includesTheWords: boolean = ['templates', 'EVIDENCIAS 2024', 'Jhon Doe', 'NOVIEMBRE', 'Plantilla Evidencias - noviembre.docx'].every((word) =>
                result.path?.includes(word),
            );
            expect(includesTheWords).toBe(true);

            expect(getUserIssuesDescriptionsMock).toHaveBeenCalledTimes(1);

            expect(fsExistsSyncMock).toHaveBeenCalledTimes(2);
            expect(fsRmSync).toHaveBeenCalledTimes(1);
            expect(fsWriteFileSync).toHaveBeenCalledTimes(1);
        });
    });

    describe('createTemplatesYear', () => {
        it('should create evidences of the year', async () => {
            const request: ICreateTemplateInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                rewrite_files: true,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const createTemplateMock = jest.spyOn(userIssueService, 'createTemplate').mockImplementation(async () => createTemplateResponseMock as any);

            const result = await userIssueService.createTemplatesYear(request);

            expect(result).toHaveProperty('userDisplayName', 'Jhon Doe');
            expect(result).toHaveProperty('evidencesCreated');
            expect(result).toHaveProperty('evidencesWithErrors');

            expect(result.evidencesCreated.total).toBe(11);
            expect(result.evidencesWithErrors.total).toBe(0);

            result.evidencesCreated.evidences.forEach((element) => {
                expect(element).toHaveProperty('project');
                expect(element).toHaveProperty('date');
                expect(element).toHaveProperty('month');
                expect(element).toHaveProperty('total');
                expect(element).toHaveProperty('path');
            });

            expect(createTemplateMock).toHaveBeenCalledTimes(11);
        });

        it('should create evidences of the year and could have an evidence with error', async () => {
            const request: ICreateTemplateInput = {
                authorization: getUserIssueReqHeaderMock.authorization,
                jira_username: getUserIssueReqBodyMock.jira_username,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                rewrite_files: true,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const createTemplateMock = jest
                .spyOn(userIssueService, 'createTemplate')
                .mockImplementationOnce(async () => createTemplateResponseMock as any)
                .mockImplementationOnce(async () => {
                    throw new Error('timeout error');
                })
                .mockImplementation(async () => createTemplateResponseMock as any);

            const result = await userIssueService.createTemplatesYear(request);

            expect(result).toHaveProperty('userDisplayName', 'Jhon Doe');
            expect(result).toHaveProperty('evidencesCreated');
            expect(result).toHaveProperty('evidencesWithErrors');

            expect(result.evidencesCreated.total).toBe(10);
            expect(result.evidencesWithErrors.total).toBe(1);

            result.evidencesCreated.evidences.forEach((element) => {
                expect(element).toHaveProperty('project');
                expect(element).toHaveProperty('date');
                expect(element).toHaveProperty('month');
                expect(element).toHaveProperty('total');
                expect(element).toHaveProperty('path');
            });

            result.evidencesWithErrors.evidences.forEach((element) => {
                expect(element).toHaveProperty('date');
                expect(element).toHaveProperty('errorMessage', 'timeout error');
            });

            expect(createTemplateMock).toHaveBeenCalledTimes(11);
        });
    });
});
