import { PageTypeEnum } from '../../enums/PageTypeEnum';
import UserIssueModel, { mongooseModel } from '../../models/UserIssueModel';
import { userIssueMock } from '../mocks/userIssueMock';

describe('UserIssueModel', () => {
    describe('create new UserIssueModel', () => {
        it('should create a new UserIssueModel and get properties', () => {
            const userIssueModel: UserIssueModel = new UserIssueModel(userIssueMock);

            expect(userIssueModel).toBeInstanceOf(UserIssueModel);

            const userIssueProps = userIssueModel.getProperties();

            expect(userIssueProps).toHaveProperty('id', '94886');
            expect(userIssueProps).toHaveProperty('key', '94886');
            expect(userIssueProps).toHaveProperty('type', 'Tarea');
            expect(userIssueProps).toHaveProperty('created', new Date('2024-10-25T00:00:00.000Z'));
            expect(userIssueProps).toHaveProperty('updated', new Date('2024-10-25T00:00:00.000Z'));
            expect(userIssueProps).toHaveProperty('assignee', 'Adrián López Varela');
            expect(userIssueProps).toHaveProperty('assignedToId', '918');
            expect(userIssueProps).toHaveProperty('status', 'Nueva');
            expect(userIssueProps).toHaveProperty('description', 'Integración DPD CH ALAS | Pruebas en PRE');
            expect(userIssueProps).toHaveProperty('summary', '');
            expect(userIssueProps).toHaveProperty('project', 'Integraciones');
            expect(userIssueProps).toHaveProperty('projectTypeKey', '821');
            expect(userIssueProps).toHaveProperty('self', 'https://projects.imatia.com/issues/94886');
            expect(userIssueProps).toHaveProperty('creator', 'Eloy Rodil Carreira');
            expect(userIssueProps).toHaveProperty('reporter', 'Eloy Rodil Carreira');
            expect(userIssueProps).toHaveProperty('pageType', PageTypeEnum.REDMINE);
        });
    });

    describe('getMongooseModel', () => {
        it('should spyOn with mock a mongooseModel.create method', async () => {
            const mock = [
                {
                    name: 'random name mock',
                },
            ];
            jest.spyOn(mongooseModel, 'create').mockImplementation(async () => mock as unknown as any);

            const result = await mongooseModel.create({ name: 'random name' });

            expect(result).toStrictEqual(mock);
        });
    });
});
