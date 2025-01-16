import { PageTypeEnum } from '../../enums/PageTypeEnum';
import UserIssueModel, { mongooseModel } from '../../models/UserIssueModel';
import { userIssueMock, userIssueMock2, userIssueMock3 } from '../mocks/userIssueMock';

describe('UserIssueModel', () => {
    describe('create new UserIssueModel', () => {
        it('should create a new UserIssueModel and get properties', () => {
            const userIssueModel: UserIssueModel = new UserIssueModel(userIssueMock);

            expect(userIssueModel).toBeInstanceOf(UserIssueModel);

            const userIssueProps = userIssueModel.getProperties();

            expect(userIssueProps).toHaveProperty('id', 94886);
            expect(userIssueProps).toHaveProperty('key', 94886);
            expect(userIssueProps).toHaveProperty('type', 'Tarea');
            expect(userIssueProps).toHaveProperty('created', new Date(userIssueMock.created));
            expect(userIssueProps).toHaveProperty('updated', new Date(userIssueMock.updated));
            expect(userIssueProps).toHaveProperty('closed', new Date(userIssueMock.closed!));
            expect(userIssueProps).toHaveProperty('assignee', 'Adrián López Varela');
            expect(userIssueProps).toHaveProperty('assignedToId', 918);
            expect(userIssueProps).toHaveProperty('status', 'Nueva');
            expect(userIssueProps).toHaveProperty('description', 'Integración DPD CH ALAS | Pruebas en PRE');
            expect(userIssueProps).toHaveProperty('summary', '');
            expect(userIssueProps).toHaveProperty('project', 'Integraciones');
            expect(userIssueProps).toHaveProperty('projectTypeKey', 821);
            expect(userIssueProps).toHaveProperty('self', 'https://redmine-example.com/issues/94886');
            expect(userIssueProps).toHaveProperty('creator', 'Eloy Rodil Carreira');
            expect(userIssueProps).toHaveProperty('reporter', 'Eloy Rodil Carreira');
            expect(userIssueProps).toHaveProperty('pageType', PageTypeEnum.REDMINE);
        });

        it('should create a new UserIssueModel and get properties 2', () => {
            const userIssueModel: UserIssueModel = new UserIssueModel(userIssueMock2);

            expect(userIssueModel).toBeInstanceOf(UserIssueModel);

            const userIssueProps = userIssueModel.getProperties();

            expect(userIssueProps).toHaveProperty('id', 94886);
            expect(userIssueProps).toHaveProperty('key', 94886);
            expect(userIssueProps).toHaveProperty('type', 'Tarea');
            expect(userIssueProps).toHaveProperty('created', new Date(userIssueMock2.created));
            expect(userIssueProps).toHaveProperty('updated', new Date(userIssueMock2.updated));
            expect(userIssueProps).toHaveProperty('closed', undefined);
            expect(userIssueProps).toHaveProperty('assignee', 'Adrián López Varela');
            expect(userIssueProps).toHaveProperty('assignedToId', 918);
            expect(userIssueProps).toHaveProperty('status', 'Nueva');
            expect(userIssueProps).toHaveProperty('description', '');
            expect(userIssueProps).toHaveProperty('summary', '');
            expect(userIssueProps).toHaveProperty('project', 'Integraciones');
            expect(userIssueProps).toHaveProperty('projectTypeKey', 821);
            expect(userIssueProps).toHaveProperty('self', 'https://redmine-example.com/issues/94886');
            expect(userIssueProps).toHaveProperty('creator', 'Eloy Rodil Carreira');
            expect(userIssueProps).toHaveProperty('reporter', 'Eloy Rodil Carreira');
            expect(userIssueProps).toHaveProperty('pageType', PageTypeEnum.REDMINE);
        });

        it('should create a new UserIssueModel and get properties 3 (without assignee user)', () => {
            const userIssueModel: UserIssueModel = new UserIssueModel(userIssueMock3);

            expect(userIssueModel).toBeInstanceOf(UserIssueModel);

            const userIssueProps = userIssueModel.getProperties();

            expect(userIssueProps).toHaveProperty('id', '34re354gr43');
            expect(userIssueProps).toHaveProperty('key', 'JX-213');
            expect(userIssueProps).toHaveProperty('type', 'ERROR');
            expect(userIssueProps).toHaveProperty('created', new Date('10/12/2024'));
            expect(userIssueProps).toHaveProperty('updated', new Date('10/12/2024'));
            expect(userIssueProps).toHaveProperty('closed', undefined);
            expect(userIssueProps).toHaveProperty('assignee', '');
            expect(userIssueProps).toHaveProperty('assignedToId', '');
            expect(userIssueProps).toHaveProperty('status', 'backlog');
            expect(userIssueProps).toHaveProperty('description', '');
            expect(userIssueProps).toHaveProperty('summary', 'toggle bar doesn\'t work');
            expect(userIssueProps).toHaveProperty('project', 'Jira project example');
            expect(userIssueProps).toHaveProperty('projectTypeKey', '01');
            expect(userIssueProps).toHaveProperty('self', 'https://www.jira-example.com/browse/JX-213');
            expect(userIssueProps).toHaveProperty('creator', 'Jhon Doe');
            expect(userIssueProps).toHaveProperty('reporter', 'Zack Smith');
            expect(userIssueProps).toHaveProperty('pageType', 'JIRA');
        });
    });

    describe('getMongooseModel', () => {
        it('should spyOn with mock a mongooseModel.create method', async () => {
            const mock = [
                {
                    name: 'random name mock',
                },
            ];
            jest.spyOn(mongooseModel, 'create').mockImplementation(async () => mock as any);

            const result = await mongooseModel.create({ name: 'random name' });

            expect(result).toStrictEqual(mock);
        });
    });
});
