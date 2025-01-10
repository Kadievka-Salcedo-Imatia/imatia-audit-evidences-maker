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
import { userIssueMock, userIssueMock2 } from '../mocks/userIssueMock';
import JiraService from '../../services/jira.service';
import { jiraIssuesMock, jiraIssuesProcessedMock } from '../mocks/jiraIssuesMock';
import IUserIssue from '../../interfaces/IUserIssue';
import IEvidence from '../../interfaces/IEvidence';
import { MONTHS } from '../../resources/configurations/constants/Months';
import IIssueDescription from '../../interfaces/IIssueDescription';
import { Paragraph } from 'docx';
import ICreateTemplateInput from '../../interfaces/ICreateTemplateInput';
import { createTemplateResponseMock } from '../mocks/createTemplateResponseMock';
import UserTemplateService from '../../services/userTemplate.service';
import IGetDownloadLinksInput from '../../interfaces/IGetDownloadLinksInput';
import { userTemplateJiraMock, userTemplateRedmineMock } from '../mocks/userTemplateMock';
import IUserIssueDetailInput from '../../interfaces/IUserIssueDetailInput';
import IUserIssueDetail from '../../interfaces/IUserIssueDetail';
import BaseErrorClass from '../../resources/configurations/classes/BaseErrorClass';
import INTERNAL_ERROR_CODES from '../../resources/configurations/constants/InternalErrorCodes';
import RESPONSE_STATUS_CODES from '../../resources/configurations/constants/ResponseStatusCodes';
import puppeteer, { Browser } from 'puppeteer';
import { getEvidenceInfoMock } from '../mocks/evidenceDescriptionResponseMock';

const launchMock = jest.spyOn(puppeteer, 'launch').mockImplementation(
    async () =>
        ({
            close: () => {},
            newPage: async () => ({
                setViewport: () => {},
                goto: () => {},
                type: () => ({}),
                focus: () => ({}),
                click: () => ({}),
                waitForNavigation: () => ({}),
                evaluate: () => ({}),
                screenshot: () => new Uint8Array(0),
                close: () => ({}),
                waitForSelector: () => ({
                    screenshot: () => new Uint8Array(0),
                }),
            }),
        }) as unknown as Browser,
);

const redmineIssue = redmineIssuesMock.issues[0];

const userIssueFromDBMock = new UserIssueModel(userIssueMock);

const userTemplateService = UserTemplateService.getInstance();

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

    describe('mapIssuesFromJira method', () => {
        it('should take jira response issue and transform it into the standar schema for user issues', () => {
            const result = UserIssueService.mapIssuesFromJira(jiraIssuesMock.issues, 'https://jira.testing.com');

            expect(result.length).toBe(3);
            expect(result[0]).toMatchObject({
                assignee: 'Jhon Doe',
                created: '2024-06-06T10:31:32.000+0200',
                description: 'Llevar a PRO de ourense las tareas relacionadas. Sólo cividas.',
                id: '40517',
                key: 'OUINT-333',
                pageType: 'JIRA',
                project: 'Project Name Test',
                projectTypeKey: 'software',
                self: 'https://jira.testing.com/browse/OUINT-333',
                status: 'Listo',
                summary: 'OUR - Llevar a PRO última versión cividas core',
                type: 'Tarea',
                updated: '2024-07-17T17:04:08.000+0200',
            });
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
                header: getUserIssueReqHeaderMock.header,
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
                header: getUserIssueReqHeaderMock.header,
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
                header: getUserIssueReqHeaderMock.header,
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
                header: getUserIssueReqHeaderMock.header,
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
                header: getUserIssueReqHeaderMock.header,
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
                header: getUserIssueReqHeaderMock.header,
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

    describe('getDbRedmineUserIssueById method', () => {
        it('should get issue by internal redmine id from db', async () => {
            const findMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue(userIssueFromDBMock.getProperties() as any);

            const assignedToId: number = 1;
            const id = '44224';

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.getDbRedmineUserIssueById(assignedToId, id);

            expect(result).toMatchObject(userIssueFromDBMock.getProperties());
            expect(findMock).toHaveBeenCalledTimes(1);
        });

        it('should return null if finds nothing', async () => {
            const findMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue(null as any);

            const assignedToId: number = 1;
            const id = '44224';

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.getDbRedmineUserIssueById(assignedToId, id);

            expect(result).toBe(null);
            expect(findMock).toHaveBeenCalledTimes(1);
        });

        it('should throw error if findOne throws error', async () => {
            const findMock = jest.spyOn(mongooseModel, 'findOne').mockImplementation(() => {
                throw new Error('error finding db user issue');
            });

            const assignedToId: number = 1;
            const id = '44224';

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.getDbRedmineUserIssueById(assignedToId, id)).rejects.toThrow('error finding db user issue');
            expect(findMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getUserIssues method', () => {
        it('should call jira service if jira_username is defined in the request', async () => {
            const jiraService: JiraService = JiraService.getInstance();

            const jiraServiceGetUserIssuesMock = jest.spyOn(jiraService, 'getUserIssues').mockImplementation((async () => jiraIssuesMock) as any);

            const request: IUserIssuesInput = {
                header: getUserIssueReqHeaderMock.header,
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

        it('should call get user issues from db service if redmine_id is defined in the request', async () => {
            const request: IUserIssuesInput = {
                header: getUserIssueReqHeaderMock.header,
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
    });

    describe('getUserIssueDetail method', () => {
        it('should call jira service if jira_username is defined in the request', async () => {
            const jiraService: JiraService = JiraService.getInstance();
            const jiraServiceGetUserIssuesMock = jest.spyOn(jiraService, 'getUserIssues').mockImplementation((async () => jiraIssuesMock) as any);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const request: IUserIssueDetailInput = {
                header: getUserIssueReqHeaderMock.header,
                jira_username: getUserIssueReqBodyMock.jira_username,
                issue_id: '4224',
            };

            const result = await userIssueService.getUserIssueDetail(request);
            const expectedResult: IUserIssueDetail = { ...jiraIssuesMock.issues[0], screenshot: Buffer.from('') };

            expect(result).toMatchObject(expectedResult);
            expect(jiraServiceGetUserIssuesMock).toHaveBeenCalledTimes(1);
        });

        it('should throw an Axios Error when the request to jira fails, maybe id the issue_id is not found in jira', async () => {
            const axiosError = {
                name: 'AxiosError',
                message: 'Request failed with status code 400',
                code: 'ERR_BAD_REQUEST',
                status: 400,
                config: {
                    baseURL: 'https://jira.testing.com',
                    params: {
                        jql: 'assignee in (jhon doe) AND id=42242',
                    },
                    method: 'get',
                    url: '/rest/api/2/search',
                },
            } as any;

            const jiraService: JiraService = JiraService.getInstance();
            const jiraServiceGetUserIssuesMock = jest.spyOn(jiraService, 'getUserIssues').mockImplementation(async () => {
                throw axiosError;
            });

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const request: IUserIssueDetailInput = {
                header: getUserIssueReqHeaderMock.header,
                jira_username: getUserIssueReqBodyMock.jira_username,
                issue_id: '4224',
            };

            await expect(userIssueService.getUserIssueDetail(request)).rejects.toThrow(
                new BaseErrorClass({
                    responseStatus: {
                        statusCode: axiosError.status,
                        message: axiosError.message,
                    },
                    code: INTERNAL_ERROR_CODES.JIRA_ISSUE_NOT_FOUND.code,
                    message: INTERNAL_ERROR_CODES.JIRA_ISSUE_NOT_FOUND.message,
                    error: {
                        code: axiosError.code,
                        config: {
                            baseURL: axiosError.config.baseURL,
                            params: axiosError.config.params,
                            method: axiosError.config.method,
                            url: axiosError.config.url,
                        },
                    },
                }),
            );
            expect(jiraServiceGetUserIssuesMock).toHaveBeenCalledTimes(1);
        });

        it('should throw an Notfound Error when the request to jira fails', async () => {
            const jiraService: JiraService = JiraService.getInstance();
            const jiraServiceGetUserIssuesMock = jest.spyOn(jiraService, 'getUserIssues').mockImplementation(async () => {
                throw new Error('random error');
            });

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const request: IUserIssueDetailInput = {
                header: getUserIssueReqHeaderMock.header,
                jira_username: getUserIssueReqBodyMock.jira_username,
                issue_id: '4224',
            };

            await expect(userIssueService.getUserIssueDetail(request)).rejects.toThrow(
                new BaseErrorClass({
                    responseStatus: RESPONSE_STATUS_CODES.NOT_FOUND,
                    code: INTERNAL_ERROR_CODES.JIRA_ISSUE_NOT_FOUND.code,
                    message: INTERNAL_ERROR_CODES.JIRA_ISSUE_NOT_FOUND.message,
                }),
            );
            expect(jiraServiceGetUserIssuesMock).toHaveBeenCalledTimes(1);
        });

        it('should call get user issues from db service if redmine_id is defined in the request', async () => {
            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const getDbRedmineUserIssueByIdMock = jest.spyOn(userIssueService, 'getDbRedmineUserIssueById').mockImplementation((async () => userIssueMock) as any);

            const request: IUserIssueDetailInput = {
                header: getUserIssueReqHeaderMock.header,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                issue_id: '4224',
            };

            const result = await userIssueService.getUserIssueDetail(request);
            const expectedResult: IUserIssueDetail = {
                screenshot: Buffer.from(''),
                id: userIssueMock.id,
                key: userIssueMock.key,
                type: userIssueMock.type,
                created: userIssueMock.created,
                updated: userIssueMock.updated,
                assignee: userIssueMock.assignee,
                assignedToId: userIssueMock.assignedToId,
                status: userIssueMock.status,
                description: userIssueMock.description,
                summary: userIssueMock.summary,
                project: userIssueMock.project,
                projectTypeKey: userIssueMock.projectTypeKey,
                self: userIssueMock.self,
                creator: userIssueMock.creator,
                reporter: userIssueMock.reporter,
                pageType: userIssueMock.pageType,
            };

            expect(result).toMatchObject(expectedResult);
            expect(getDbRedmineUserIssueByIdMock).toHaveBeenCalledTimes(1);
        });

        it('should throw a General Error when the request to redmine fails', async () => {
            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const getDbRedmineUserIssueByIdMock = jest.spyOn(userIssueService, 'getDbRedmineUserIssueById').mockImplementation((async () => {
                throw new Error('Error getting the redmine issue from DB');
            }) as any);

            const request: IUserIssueDetailInput = {
                header: getUserIssueReqHeaderMock.header,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                issue_id: '4224',
            };

            await expect(userIssueService.getUserIssueDetail(request)).rejects.toThrow('Error getting the redmine issue from DB');
            expect(getDbRedmineUserIssueByIdMock).toHaveBeenCalledTimes(1);
        });

        it('should throw an Not found Error when the request to redmine fails', async () => {
            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const getDbRedmineUserIssueByIdMock = jest.spyOn(userIssueService, 'getDbRedmineUserIssueById').mockImplementation((async () => null) as any);

            const request: IUserIssueDetailInput = {
                header: getUserIssueReqHeaderMock.header,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                issue_id: '4224',
            };

            await expect(userIssueService.getUserIssueDetail(request)).rejects.toThrow(
                new BaseErrorClass({
                    responseStatus: RESPONSE_STATUS_CODES.NOT_FOUND,
                    code: INTERNAL_ERROR_CODES.REDMINE_ISSUE_NOT_FOUND.code,
                    message: INTERNAL_ERROR_CODES.REDMINE_ISSUE_NOT_FOUND.message,
                }),
            );
            expect(getDbRedmineUserIssueByIdMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getUserIssuesDescriptions method', () => {
        it('should call get user issues from db service if redmine_id is defined in the request', async () => {
            const request: IUserIssuesInput = {
                header: getUserIssueReqHeaderMock.header,
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
    });

    describe('getPageType method', () => {
        it('returns JIRA if jira_username only is passed', async () => {
            const request: ICreateTemplateInput = {
                month: 1,
                year: 20024,
                header: {
                    getCredentials: ['jhon doe', '123'],
                    authorization: 'dsfdssfsdfds',
                },
                jira_username: 'jhon doe',
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const result = userIssueService.getPageType(request);

            expect(result).toBe('JIRA');
        });
        it('returns REDMINE if redmine_id only is passed', async () => {
            const request: ICreateTemplateInput = {
                month: 1,
                year: 20024,
                header: {
                    getCredentials: ['jhon doe', '123'],
                    authorization: 'dsfdssfsdfds',
                },
                redmine_id: 9999,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const result = userIssueService.getPageType(request);

            expect(result).toBe('REDMINE');
        });
        it('returns undefined', async () => {
            const request: ICreateTemplateInput = {
                month: 1,
                year: 20024,
                header: {
                    getCredentials: ['jhon doe', '123'],
                    authorization: 'dsfdssfsdfds',
                },
                jira_username: 'jhon doe',
                redmine_id: 9999,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const result = userIssueService.getPageType(request);

            expect(result).toBeUndefined();
        });
    });

    describe('createTemplate', () => {
        const createUserTemplateMock = jest.spyOn(userTemplateService, 'createUserTemplate').mockImplementation((async () => {}) as any);

        it('should return an empty array of issues if the user has not evidences', async () => {
            const request: ICreateTemplateInput = {
                header: getUserIssueReqHeaderMock.header,
                jira_username: getUserIssueReqBodyMock.jira_username,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getUserIssuesDescriptionsMock = jest
                .spyOn(userIssueService, 'getUserIssuesDescriptions')
                .mockImplementationOnce(async () => getEvidenceInfoMock([], request, true));

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

            expect(createUserTemplateMock).toHaveBeenCalledTimes(0);
        });

        it('should create a new folder for the year if it does no exist and the evidences files too', async () => {
            const fsExistsSyncMock = jest
                .spyOn(fs, 'existsSync')
                .mockImplementationOnce((_pathName) => false) // exist the folder of the year?
                .mockImplementationOnce((_pathName) => false); // exist the file of evidences?

            const fsMkdirSync = jest.spyOn(fs, 'mkdirSync').mockImplementationOnce((_pathName, _options) => ''); // creates the folder of the year if does not exist

            const fsWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementationOnce((_pathName, _options) => ''); // creates the file

            const request: ICreateTemplateInput = {
                header: getUserIssueReqHeaderMock.header,
                jira_username: getUserIssueReqBodyMock.jira_username,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getUserIssuesDescriptionsMock = jest
                .spyOn(userIssueService, 'getUserIssuesDescriptions')
                .mockImplementation(async () => getEvidenceInfoMock([userIssueMock, userIssueMock2, userIssueMock], request));

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
            expect(fsMkdirSync).toHaveBeenCalledTimes(1);
            expect(fsWriteFileSync).toHaveBeenCalledTimes(1);

            expect(createUserTemplateMock).toHaveBeenCalledTimes(1);
        });

        it('should log error if create user template on the DB fails', async () => {
            createUserTemplateMock.mockImplementationOnce(() => {
                throw new Error('create the template on DB error');
            });

            const fsExistsSyncMock = jest
                .spyOn(fs, 'existsSync')
                .mockImplementationOnce((_pathName) => false) // exist the folder of the year?
                .mockImplementationOnce((_pathName) => false); // exist the file of evidences?

            const fsMkdirSync = jest.spyOn(fs, 'mkdirSync').mockImplementationOnce((_pathName, _options) => ''); // creates the folder of the year if does not exist

            const fsWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementationOnce((_pathName, _options) => ''); // creates the file

            const request: ICreateTemplateInput = {
                header: getUserIssueReqHeaderMock.header,
                jira_username: getUserIssueReqBodyMock.jira_username,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getUserIssuesDescriptionsMock = jest
                .spyOn(userIssueService, 'getUserIssuesDescriptions')
                .mockImplementationOnce(async () => getEvidenceInfoMock([userIssueMock, userIssueMock2, userIssueMock], request, true));

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
            expect(fsMkdirSync).toHaveBeenCalledTimes(1);
            expect(fsWriteFileSync).toHaveBeenCalledTimes(1);

            expect(createUserTemplateMock).toHaveBeenCalledTimes(1);
        });

        it('should return only the template info if evidence files already exists and rewrite files request is false', async () => {
            const fsExistsSyncMock = jest
                .spyOn(fs, 'existsSync')
                .mockImplementationOnce((_pathName) => true) // exist the folder of the year?
                .mockImplementationOnce((_pathName) => true); // exist the file of evidences?

            const request: ICreateTemplateInput = {
                header: getUserIssueReqHeaderMock.header,
                jira_username: getUserIssueReqBodyMock.jira_username,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getUserIssuesDescriptionsMock = jest
                .spyOn(userIssueService, 'getUserIssuesDescriptions')
                .mockImplementationOnce(async () => getEvidenceInfoMock([userIssueMock, userIssueMock2, userIssueMock], request, true));

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
            expect(createUserTemplateMock).toHaveBeenCalledTimes(0);
        });

        it('should delete and create again the evidence document if evidence files already exists and rewrite files request is true', async () => {
            const fsExistsSyncMock = jest
                .spyOn(fs, 'existsSync')
                .mockImplementationOnce((_pathName) => true) // exist the folder of the year?
                .mockImplementationOnce((_pathName) => true); // exist the file of evidences?

            const fsRmSync = jest.spyOn(fs, 'rmSync').mockImplementationOnce((_pathName) => {}); // remove file if exists and rewrite is true

            const fsWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementationOnce((_pathName, _options) => ''); // creates the file

            const request: ICreateTemplateInput = {
                header: getUserIssueReqHeaderMock.header,
                jira_username: getUserIssueReqBodyMock.jira_username,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                rewrite_files: true,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getUserIssuesDescriptionsMock = jest
                .spyOn(userIssueService, 'getUserIssuesDescriptions')
                .mockImplementation(async () => getEvidenceInfoMock([userIssueMock, userIssueMock2, userIssueMock], request, true));

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

            expect(createUserTemplateMock).toHaveBeenCalledTimes(1);
        });

        it('should handle request with redmine_id only', async () => {
            const fsExistsSyncMock = jest
                .spyOn(fs, 'existsSync')
                .mockImplementationOnce((_pathName) => true) // exist the folder of the year?
                .mockImplementationOnce((_pathName) => true); // exist the file of evidences?

            const fsRmSync = jest.spyOn(fs, 'rmSync').mockImplementationOnce((_pathName) => {}); // remove file if exists and rewrite is true

            const fsWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementationOnce((_pathName, _options) => ''); // creates the file

            const request: ICreateTemplateInput = {
                header: getUserIssueReqHeaderMock.header,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                rewrite_files: true,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

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

            const fsWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementationOnce((_pathName, _options) => ''); // creates the file

            const request: ICreateTemplateInput = {
                header: getUserIssueReqHeaderMock.header,
                jira_username: getUserIssueReqBodyMock.jira_username,
                jira_base_url: getUserIssueReqBodyMock.jira_base_url,
                jira_url: getUserIssueReqBodyMock.jira_url,
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                rewrite_files: true,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getUserIssuesDescriptionsMock = jest
                .spyOn(userIssueService, 'getUserIssuesDescriptions')
                .mockImplementationOnce(async () => getEvidenceInfoMock([userIssueMock, userIssueMock2, userIssueMock], request, true));

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
            expect(createUserTemplateMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('createTemplatesYear', () => {
        it('should create evidences of the year', async () => {
            const request: ICreateTemplateInput = {
                header: getUserIssueReqHeaderMock.header,
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
                header: getUserIssueReqHeaderMock.header,
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

        it('should create evidences of the year no leap', async () => {
            const request: ICreateTemplateInput = {
                header: getUserIssueReqHeaderMock.header,
                jira_username: getUserIssueReqBodyMock.jira_username,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                month: getUserIssueReqBodyMock.month,
                year: 2023,
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

    describe('forceScroll', () => {
        it('should test forceScroll method', () => {
            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const result = userIssueService.forceScroll();

            expect(result).toBeDefined();
        });
    });

    describe('getDownloadLinks', () => {
        it('should get some download links', async () => {
            const request: IGetDownloadLinksInput = {
                header: {
                    getCredentials: ['jhon.doe', '21231322'],
                    authorization: 'Basic auth string',
                },
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const getUserTemplatesMock = jest.spyOn(userTemplateService, 'getUserTemplates').mockImplementation(
                async () =>
                    [
                        {
                            toObject: () => userTemplateJiraMock,
                        },
                        {
                            toObject: () => userTemplateRedmineMock,
                        },
                    ] as any,
            );

            const result = await userIssueService.getDownloadLinks(request);

            result.forEach((element) => {
                expect(element).toHaveProperty('pageType');
                expect(element).toHaveProperty('year');
                expect(element).toHaveProperty('downloadUrl');
            });

            expect(getUserTemplatesMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('splitIssuesByTypeAndGetImages', () => {
        it('should test the case issues are empty', async () => {
            const request: ICreateTemplateInput = {
                header: getUserIssueReqHeaderMock.header,
                month: 11,
                year: 2024,
            };

            const evidence: IEvidence = {
                project: 'Project name',
                userDisplayName: 'Jhon Doe',
                date: 'Noviembre 2024',
                month: 'NOVIEMBRE',
                evidenceStart: '1',
                total: 0,
            };

            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const result: Paragraph[] = await userIssueService.splitIssuesByTypeAndGetImages(evidence, request);

            expect(result.length === 0).toBeTruthy();
        });

        it('should return paragraphs from issues array', async () => {
            const request: IUserIssuesInput = {
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                header: getUserIssueReqHeaderMock.header,
                jira_username: 'jhon doe',
            };

            const evidence: IEvidence = getEvidenceInfoMock([userIssueMock, userIssueMock2, userIssueMock], request, true);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.splitIssuesByTypeAndGetImages(evidence, request);

            expect(result.length).toBe(3);
            expect(result[0]).toBeInstanceOf(Paragraph);
        });
    });

    describe('getIssuesParagraphs', () => {
        it('should return paragraphs from issues array', async () => {
            const request: IUserIssuesInput = {
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                header: getUserIssueReqHeaderMock.header,
                jira_username: 'jhon doe',
            };

            const evidence: IEvidence = getEvidenceInfoMock([userIssueMock, userIssueMock2, userIssueMock], request, true);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = userIssueService.getIssuesParagraphs(evidence);

            expect(result.length).toBe(7);
            expect(result[0]).toBeInstanceOf(Paragraph);
        });
    });

    describe('takeScreenshot', () => {
        it('should take screenshot with jira issue', async () => {
            const browser: Browser = await puppeteer.launch();

            const request: IUserIssuesInput = {
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                header: getUserIssueReqHeaderMock.header,
                jira_username: 'jhon doe',
            };
            const evidence: IEvidence = getEvidenceInfoMock([userIssueMock], request, true);

            const issue: IIssueDescription = evidence.issues![0];

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.takeScreenshot(issue, browser, true, request.header.getCredentials);

            expect(result).toBeInstanceOf(Buffer);
            expect(launchMock).toHaveBeenCalledTimes(1);
        });

        it('should take screenshot with redmine issue', async () => {
            const browser: Browser = await puppeteer.launch();

            const request: IUserIssuesInput = {
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                header: getUserIssueReqHeaderMock.header,
                redmine_id: 100,
            };
            const evidence: IEvidence = getEvidenceInfoMock([userIssueMock], request, false);

            const issue: IIssueDescription = evidence.issues![0];

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.takeScreenshot(issue, browser, true, request.header.getCredentials);

            expect(result).toBeInstanceOf(Buffer);
            expect(launchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getEvidenceImages', () => {
        it('should get jira evidence images', async () => {
            const request: IUserIssuesInput = {
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                header: getUserIssueReqHeaderMock.header,
                jira_username: 'jhon doe',
            };
            const evidence: IEvidence = getEvidenceInfoMock([userIssueMock, userIssueMock2, userIssueMock], request, true);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const takeScreenshotMock = jest.spyOn(userIssueService, 'takeScreenshot').mockImplementation(async () => Buffer.from('abc'));

            const result = await userIssueService.getEvidenceImages(evidence, request);

            expect(result.length).toBe(3);
            expect(takeScreenshotMock).toHaveBeenCalledTimes(3);
            expect(launchMock).toHaveBeenCalledTimes(1);
        });

        it('should continue if takeScreenshot fails get jira evidence images', async () => {
            const request: IUserIssuesInput = {
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                header: getUserIssueReqHeaderMock.header,
                jira_username: 'jhon doe',
            };
            const evidence: IEvidence = getEvidenceInfoMock([userIssueMock, userIssueMock2, userIssueMock], request, true);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const takeScreenshotMock = jest
                .spyOn(userIssueService, 'takeScreenshot')
                .mockImplementationOnce(async () => {
                    throw new Error('Error taking screenshot');
                })
                .mockImplementation(async () => Buffer.from('abc'));

            const result = await userIssueService.getEvidenceImages(evidence, request);

            expect(result.length).toBe(2);
            expect(takeScreenshotMock).toHaveBeenCalledTimes(3);
            expect(launchMock).toHaveBeenCalledTimes(1);
        });

        it('should get redmine evidence images', async () => {
            const request: IUserIssuesInput = {
                month: getUserIssueReqBodyMock.month,
                year: getUserIssueReqBodyMock.year,
                header: getUserIssueReqHeaderMock.header,
                redmine_id: 200,
            };
            const evidence: IEvidence = getEvidenceInfoMock([userIssueMock, userIssueMock2, userIssueMock], request, false);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.getEvidenceImages(evidence, request);

            expect(result.length).toBe(4);
            expect(launchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('downloadTemplate', () => {
        it('should throw error if id is undefined', async () => {
            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.downloadTemplate()).rejects.toThrow('Bad request');
        });

        it('should throw error if getById fails', async () => {
            const getByIdMock = jest.spyOn(userTemplateService, 'getById').mockImplementation(async () => {
                throw new Error('error getting by id');
            });

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.downloadTemplate('6734c5429411eee699ab6257')).rejects.toThrow('General unknown error');

            expect(getByIdMock).toHaveBeenCalledTimes(1);
        });

        it('should throw error if the DB document does not exist', async () => {
            const getByIdMock = jest.spyOn(userTemplateService, 'getById').mockImplementation(async () => undefined);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.downloadTemplate('6734c5429411eee699ab6257')).rejects.toThrow(
                'The specified user template id does not exist in the DB: 6734c5429411eee699ab6257',
            );

            expect(getByIdMock).toHaveBeenCalledTimes(1);
        });

        it('should throw error if the DB document path does not exist', async () => {
            const getByIdMock = jest.spyOn(userTemplateService, 'getById').mockImplementation(async () => ({
                fields: 'other fields',
            }));

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.downloadTemplate('6734c5429411eee699ab6257')).rejects.toThrow(
                'The specified user template id does not exist in the DB: 6734c5429411eee699ab6257',
            );

            expect(getByIdMock).toHaveBeenCalledTimes(1);
        });

        it('should throw error if the file does not exist', async () => {
            const getByIdMock = jest.spyOn(userTemplateService, 'getById').mockImplementation(async () => ({
                path: '/this_directory_does_not_exist',
            }));

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.downloadTemplate('6734c5429411eee699ab6257')).rejects.toThrow(
                'The specified file path does not exist in the directory: /this_directory_does_not_exist',
            );

            expect(getByIdMock).toHaveBeenCalledTimes(1);
        });

        it('should return the path', async () => {
            const getByIdMock = jest.spyOn(userTemplateService, 'getById').mockImplementation(async () => ({
                path: '/templates/template-test.doc',
            }));

            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(true);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.downloadTemplate('6734c5429411eee699ab6257');

            expect(result).toStrictEqual({ path: '/templates/template-test.doc' });
            expect(getByIdMock).toHaveBeenCalledTimes(1);
            expect(existsSyncMock).toHaveBeenCalledTimes(1);
        });
    });
});
