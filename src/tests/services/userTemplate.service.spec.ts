import IGetUserTemplatesInput from '../../interfaces/IGetUserTemplatesInput';
import IUserTemplate from '../../interfaces/IUserTemplate';
import UserTemplateModel, { mongooseModel } from '../../models/UserTemplateModel';
import UserTemplateService from '../../services/userTemplate.service';
import { userTemplateJiraMock, userTemplateRedmineMock } from '../mocks/userTemplateMock';

describe('UserTemplateService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getInstance method', () => {
        it('should return the same jira service instance', () => {
            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();
            const userTemplateService2 = UserTemplateService.getInstance();
            expect(userTemplateService).toBeInstanceOf(UserTemplateService);
            expect(userTemplateService).toStrictEqual(userTemplateService2);
        });
    });

    describe('createUserTemplate method', () => {
        it('should create an user template doc if it does no exist', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue(null as any);
            const createMock = jest.spyOn(mongooseModel, 'create').mockImplementation(async () => userTemplateRedmineMock as any);

            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

            const userTemplateInput: IUserTemplate = {
                ...userTemplateRedmineMock,
            };

            const result = await userTemplateService.createUserTemplate(userTemplateInput);

            const expectedResult = new UserTemplateModel({ ...userTemplateInput }).getProperties();

            expect(result).toStrictEqual(expectedResult);
            expect(findOneMock).toHaveBeenCalledTimes(1);
            expect(createMock).toHaveBeenCalledTimes(1);
        });

        it('should update an user template if it do exist', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue({ ...userTemplateJiraMock, save: async () => userTemplateJiraMock } as any);

            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

            const result = await userTemplateService.createUserTemplate(userTemplateJiraMock);

            const expectedResult = userTemplateJiraMock;

            expect(result).toStrictEqual(expectedResult);
            expect(findOneMock).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if findOne fails', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockImplementation((async () => {
                throw new Error('findOne error');
            }) as any);

            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

            await expect(userTemplateService.createUserTemplate(userTemplateRedmineMock)).rejects.toThrow('findOne error');
            expect(findOneMock).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if save fails', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue({
                ...userTemplateRedmineMock,
                save: async () => {
                    throw new Error('save error');
                },
            } as any);

            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

            await expect(userTemplateService.createUserTemplate(userTemplateRedmineMock)).rejects.toThrow('save error');
            expect(findOneMock).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if create fails', async () => {
            const findOneMock = jest.spyOn(mongooseModel, 'findOne').mockReturnValue(null as any);
            const createMock = jest.spyOn(mongooseModel, 'create').mockImplementation((async () => {
                throw new Error('create error');
            }) as any);

            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

            await expect(userTemplateService.createUserTemplate(userTemplateRedmineMock)).rejects.toThrow('create error');
            expect(findOneMock).toHaveBeenCalledTimes(1);
            expect(createMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getUserTemplates method', () => {
        it('should get templates from db', async () => {
            const findMock = jest.spyOn(mongooseModel, 'find').mockReturnValue({
                skip: () => ({
                    limit: () => ({
                        sort: () => [userTemplateRedmineMock, userTemplateJiraMock],
                    }),
                }),
            } as any);

            const request: IGetUserTemplatesInput = {
                username: 'john.doe',
                year: 2024,
                offset: 0,
                limit: 100,
            };

            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

            const result = await userTemplateService.getUserTemplates(request);

            expect(result).toMatchObject([userTemplateRedmineMock, userTemplateJiraMock]);
            expect(findMock).toHaveBeenCalledTimes(1);
        });

        it('should return null if finds nothing', async () => {
            const findMock = jest.spyOn(mongooseModel, 'find').mockReturnValue({
                skip: () => ({
                    limit: () => ({
                        sort: () => null,
                    }),
                }),
            } as any);

            const request: IGetUserTemplatesInput = {
                username: 'john.doe',
            };

            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

            const result = await userTemplateService.getUserTemplates(request);

            expect(result).toBe(null);
            expect(findMock).toHaveBeenCalledTimes(1);
        });

        it('should throw error if find throws error', async () => {
            const findMock = jest.spyOn(mongooseModel, 'find').mockReturnValue({
                skip: () => ({
                    limit: () => ({
                        sort: () => {
                            throw new Error('error finding db user templates');
                        },
                    }),
                }),
            } as any);

            const request: IGetUserTemplatesInput = {
                username: 'john.doe',
            };

            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

            await expect(userTemplateService.getUserTemplates(request)).rejects.toThrow('error finding db user templates');
            expect(findMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('getById method', () => {
        it('should get templates from db', async () => {
            const findByIdMock = jest.spyOn(mongooseModel, 'findById').mockReturnValue(userTemplateRedmineMock as any);

            const id: string = '6734c5429411eee699ab6257';

            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

            const result = await userTemplateService.getById(id);

            expect(result).toMatchObject(userTemplateRedmineMock);
            expect(findByIdMock).toHaveBeenCalledTimes(1);
        });

        it('should return null if finds nothing', async () => {
            const findByIdMock = jest.spyOn(mongooseModel, 'findById').mockReturnValue(null as any);

            const id: string = '6734c5429411eee699ab6257';

            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

            const result = await userTemplateService.getById(id);

            expect(result).toBeNull();
            expect(findByIdMock).toHaveBeenCalledTimes(1);
        });

        it('should throw error if find throws error', async () => {
            const findMock = jest.spyOn(mongooseModel, 'findById').mockImplementation((async () => {
                throw new Error('error finding by id');
            }) as any);

            const id: string = '6734c5429411eee699ab6257';

            const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

            await expect(userTemplateService.getById(id)).rejects.toThrow('error finding by id');
            expect(findMock).toHaveBeenCalledTimes(1);
        });
    });
});
