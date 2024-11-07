import { PageTypeEnum } from '../../enums/PageTypeEnum';
import UserIssueModel, { mongooseModel } from '../../models/UserIssueModel';
import UserIssueService from '../../services/userIssue.service';
import { redmineIssuesMock } from '../mocks/redmineIssuesMock';
import { userIssueMock } from '../mocks/userIssueMock';

describe('UserIssueService', () => {
    describe('getInstance method', () => {
        it('should return the same jira service instance', () => {
            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const userIssueService2 = UserIssueService.getInstance();
            expect(userIssueService).toBeInstanceOf(UserIssueService);
            expect(userIssueService).toStrictEqual(userIssueService2);
        });
    });

    describe('createUserIssue method', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should create an user issue if it does no exist', async () => {
            jest.spyOn(mongooseModel, 'findOne').mockReturnValue(null as unknown as any);

            jest.spyOn(mongooseModel, 'create').mockImplementation(async () => userIssueMock as unknown as any);

            const userIssueService: UserIssueService = UserIssueService.getInstance();
            const redmineIssue = redmineIssuesMock.issues[0];

            const result = await userIssueService.createUserIssue(redmineIssue);

            const expectedResult = new UserIssueModel({
                id: redmineIssue.id,
                key: redmineIssue.id,
                self: `${process.env.REDMINE_BASE_URL}/issues/${redmineIssue.id}`,
                type: redmineIssue.tracker.name,
                created: redmineIssue.created_on,
                updated: redmineIssue.updated_on,
                closed: redmineIssue.closed_on,
                assignee: redmineIssue.assigned_to?.name || '',
                assignedToId: redmineIssue.assigned_to?.id || '',
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
        });
    });
});
