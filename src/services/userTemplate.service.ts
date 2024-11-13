import IGetUserTemplatesInput from '../interfaces/IGetUserTemplatesInput';
import IUserTemplate from '../interfaces/IUserTemplate';
import UserTemplateModel, { mongooseModel } from '../models/UserTemplateModel';
import getLogger from '../utils/logger';

const log = getLogger('userTemplate.service.ts');

export default class UserTemplateService {
    public static instance: UserTemplateService;

    /**
     * Returns the single instance of UserTemplateService.
     * @returns {UserTemplateService} Singleton instance
     */
    public static getInstance(): UserTemplateService {
        if (!this.instance) {
            this.instance = new UserTemplateService();
        }
        return this.instance;
    }

    private readonly USER_TEMPLATES_LIMIT_DEFAULT: number = Number(process.env.USER_TEMPLATES_LIMIT_DEFAULT!);

    /**
     * Creates or updates by username and path an user template in MongoDB.
     * @param {IUserTemplate} userTemplateInput
     * @returns {Promise<IUserTemplate>} IUserTemplate
     */
    public async createUserTemplate(userTemplateInput: IUserTemplate): Promise<IUserTemplate> {
        log.info('  Start UserTemplateService@createUserTemplate method');

        const userTemplateModel: UserTemplateModel = new UserTemplateModel({
            username: userTemplateInput.username,
            path: userTemplateInput.path,
            createdAt: userTemplateInput.createdAt,
            updatedAt: userTemplateInput.updatedAt,
            evidenceUserDisplayName: userTemplateInput.evidenceUserDisplayName,
            pageType: userTemplateInput.pageType,
            year: userTemplateInput.year,
            month: userTemplateInput.month,
        });

        const findParameters = {
            username: userTemplateModel.username,
            path: userTemplateModel.path,
        };

        try {
            const dbRegister: any = await mongooseModel.findOne(findParameters);

            if (dbRegister) {
                await dbRegister.save({
                    updatedAt: userTemplateInput.updatedAt,
                    evidenceUserDisplayName: userTemplateInput.evidenceUserDisplayName,
                    pageType: userTemplateInput.pageType,
                    year: userTemplateInput.year,
                    month: userTemplateInput.month,
                });
                log.info('   UserTemplateService@createUserTemplate updated', findParameters);
            } else {
                await mongooseModel.create({
                    ...userTemplateModel.getProperties(),
                });
                log.info('   UserTemplateService@createUserTemplate created', findParameters);
            }
        } catch (error) {
            log.error('   Error UserTemplateService@createUserTemplate method', error);
            throw error;
        }

        log.info('  Finish UserTemplateService@createUserTemplate method');
        return userTemplateModel.getProperties();
    }

    /**
     * Gets user templates from MongoDB.
     * @param {IGetDownloadLinksInput} request year offset and limit get params
     * @returns {Promise<FindCursor>} user issues information comes from the database
     */
    public async getUserTemplates(request: IGetUserTemplatesInput): Promise<any[]> {
        log.info('  Start UserIssueService@getUserTemplates method with params:', request);
        let userTemplates;

        try {
            userTemplates = await mongooseModel
                .find({
                    username: request.username,
                    year: request.year,
                })
                .skip(request.offset || 0)
                .limit(request.limit || this.USER_TEMPLATES_LIMIT_DEFAULT)
                .sort({ updatedAt: -1 });
        } catch (error) {
            log.error('  Error UserIssueService@createUserIssue method', error);
            throw error;
        }

        log.info('  Finish UserIssueService@getUserTemplates method');
        return userTemplates;
    }

    /**
     * Gets user template from MongoDB by id.
     * @param {string} id
     * @returns {Promise<any>}
     */
    public async getById(id: string): Promise<any> {
        return await mongooseModel.findById({ _id: id });
    }
}
