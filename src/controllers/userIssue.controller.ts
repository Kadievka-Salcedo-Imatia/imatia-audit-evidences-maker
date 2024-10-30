import ICreateTemplateYearResponse from '../interfaces/ICreateTemplateYearResponse';
import IDataIssue from '../interfaces/IDataIssue';
import IEvidence from '../interfaces/IEvidence';
import IRedmineGetIssuesInput from '../interfaces/IRedmineGetIssuesInput';
import ISyncRedmineUserIssuesOutput from '../interfaces/ISyncRedmineUserIssuesOutput';
import IUserIssuesInput from '../interfaces/IUserIssuesInput';
import UserIssueService from '../services/userIssue.service';
import { getCurrentMonth } from '../utils/dates';

export default class UserIssueController {
    public static instance: UserIssueController;

    /**
     * Returns the single instance of MainController.
     * @returns MainController - Singleton instance
     */
    public static getInstance() {
        if (!this.instance) {
            this.instance = new UserIssueController();
        }
        return this.instance;
    }

    private userIssueService: UserIssueService = UserIssueService.getInstance();

    /**
     * Calls get user issues service.
     * @returns Array of user issues
     */
    public async getUserIssues(req: any): Promise<IDataIssue> {
        const request: IUserIssuesInput = { ...req.body, ...req.headers };
        return await this.userIssueService.getUserIssues(request);
    }

    /**
     * Calls get user issues descriptions service.
     * @returns Array of user issues descriptions
     */
    public async getUserIssuesDescriptions(req: any): Promise<IEvidence> {
        const request: IUserIssuesInput = { ...req.body, ...req.headers };
        return await this.userIssueService.getUserIssuesDescriptions(request);
    }

    /**
     * Calls create user issue template service.
     * @returns user issues descriptions with the path to the created template
     */
    public async createTemplate(req: any): Promise<IEvidence> {
        const request: IUserIssuesInput = { ...req.body, ...req.headers };
        return await this.userIssueService.createTemplate(request);
    }

    /**
     * Calls create user issue templates from the year service.
     * @returns templates created
     */
    public async createTemplatesYear(req: any): Promise<ICreateTemplateYearResponse> {
        const request: IUserIssuesInput = { ...req.body, ...req.headers, month: getCurrentMonth() };
        return await this.userIssueService.createTemplatesYear(request);
    }

    /**
     * Calls sync redmine user issues service.
     * @returns templates created
     */
    public async syncRedmineUserIssues(req: any): Promise<ISyncRedmineUserIssuesOutput> {
        const request: IRedmineGetIssuesInput = { ...req.body, ...req.headers };
        return await this.userIssueService.syncRedmineUserIssues(request);
    }
}
