import { PageTypeEnum } from '../../enums/PageTypeEnum';
import IGetIssueFromRedmineInput from '../../interfaces/IGetIssueFromRedmineInput';
import UserIssueModel, { mongooseModel } from '../../models/UserIssueModel';
import RedmineService from '../../services/redmine.service';
import UserIssueService from '../../services/userIssue.service';
import { getUserIssueReqHeaderMock } from '../mocks/getUserIssueRequestMock';
import { redmineIssuesMock } from '../mocks/redmineIssuesMock';
import { syncRedmineUserIssuesReqBodyMock } from '../mocks/syncRedmineUserIssuesRequestMock';
import { userIssueMock } from '../mocks/userIssueMock';

const redmineIssue = redmineIssuesMock.issues[0];
const userIssueFromDBMock = new UserIssueModel({
    id: redmineIssue.id,
    key: redmineIssue.id,
    self: `${process.env.REDMINE_BASE_URL}/issues/${redmineIssue.id}`,
    type: redmineIssue.tracker.name,
    created: redmineIssue.created_on,
    updated: redmineIssue.updated_on,
    closed: redmineIssue.closed_on,
    assignee: redmineIssue.assigned_to.name,
    assignedToId: redmineIssue.assigned_to.id,
    status: redmineIssue.status.name,
    description: redmineIssue.subject,
    summary: redmineIssue.description,
    project: redmineIssue.project.name,
    projectTypeKey: redmineIssue.project.id,
    creator: redmineIssue.author.name,
    reporter: redmineIssue.author.name,
    pageType: PageTypeEnum.REDMINE,
});

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
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue(null as unknown as any);
            const createMock = jest.spyOn(mongooseModel, 'create').mockImplementation(async () => userIssueMock as unknown as any);

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
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue({ ...userIssueMock, save: async () => userIssueMock } as unknown as any);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            const result = await userIssueService.createUserIssue(redmineIssue);

            const expectedResult = userIssueFromDBMock.getProperties();

            expect(result).toStrictEqual(expectedResult);
            expect(findOneMock).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if findOne fails', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockImplementation((async () => {
                throw new Error('findOne error');
            }) as unknown as any);

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
            } as unknown as any);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.createUserIssue(redmineIssue)).rejects.toThrow('save error');
            expect(findOneMock).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if create fails', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue(null as unknown as any);
            const createMock = jest.spyOn(mongooseModel, 'create').mockImplementation((async () => {
                throw new Error('create error');
            }) as unknown as any);

            const userIssueService: UserIssueService = UserIssueService.getInstance();

            await expect(userIssueService.createUserIssue(redmineIssue)).rejects.toThrow('create error');
            expect(findOneMock).toHaveBeenCalledTimes(1);
            expect(createMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getIssuesFromRedmineAndSave', () => {
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

    describe('syncRedmineUserIssues', () => {
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
});
