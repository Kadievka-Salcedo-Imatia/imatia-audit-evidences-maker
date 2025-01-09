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
import ICreateTemplateInput from '../../interfaces/ICreateTemplateInput';
import { createTemplateResponseMock } from '../mocks/createTemplateResponseMock';
import UserTemplateService from '../../services/userTemplate.service';
import IGetDownloadLinksInput from '../../interfaces/IGetDownloadLinksInput';
import { userTemplateJiraMock, userTemplateRedmineMock } from '../mocks/userTemplateMock';
import IUserIssueDetailInput from '../../interfaces/IUserIssueDetailInput';
import IUserIssueDetail from '../../interfaces/IUserIssueDetail';

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

            const screenshot = Buffer.from('');
            const takeScreenshotMock = jest.spyOn(userIssueService, 'takeScreenshot').mockImplementation(async () => screenshot);

            const request: IUserIssueDetailInput = {
                header: getUserIssueReqHeaderMock.header,
                jira_username: getUserIssueReqBodyMock.jira_username,
                issue_id: '4224',
            };

            const result = await userIssueService.getUserIssueDetail(request);
            const expectedResult: IUserIssueDetail = { ...jiraIssuesMock.issues[0], screenshot };

            expect(result).toMatchObject(expectedResult);
            expect(jiraServiceGetUserIssuesMock).toHaveBeenCalledTimes(1);
            expect(takeScreenshotMock).toHaveBeenCalledTimes(1);
        });

        it('should call get user issues from db service if redmine_id is defined in the request', async () => {
            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const getDbRedmineUserIssueByIdMock = jest.spyOn(userIssueService, 'getDbRedmineUserIssueById').mockImplementation((async () => userIssueMock) as any);

            const screenshot = Buffer.from('');
            const takeScreenshotMock = jest.spyOn(userIssueService, 'takeScreenshot').mockImplementation(async () => screenshot);

            const request: IUserIssueDetailInput = {
                header: getUserIssueReqHeaderMock.header,
                redmine_id: getUserIssueReqBodyMock.redmine_id,
                issue_id: '4224',
            };

            const result = await userIssueService.getUserIssueDetail(request);
            const expectedResult: IUserIssueDetail = {
                screenshot,
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
            expect(takeScreenshotMock).toHaveBeenCalledTimes(1);
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
    });
});
