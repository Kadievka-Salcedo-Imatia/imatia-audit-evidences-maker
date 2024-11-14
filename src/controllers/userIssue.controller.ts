import ICreateTemplateInput from '../interfaces/ICreateTemplateInput';
import ICreateTemplateYearOutput from '../interfaces/ICreateTemplateYearOutput';
import IDataIssue from '../interfaces/IDataIssue';
import IEvidence from '../interfaces/IEvidence';
import IGetDownloadLinksInput from '../interfaces/IGetDownloadLinksInput';
import IGetDownloadLinksOutput from '../interfaces/IGetDownloadLinksOutput';
import IGetIssueFromRedmineInput from '../interfaces/IGetIssueFromRedmineInput';
import ISyncRedmineUserIssuesOutput from '../interfaces/ISyncRedmineUserIssuesOutput';
import IUserIssuesInput from '../interfaces/IUserIssuesInput';
import UserIssueService from '../services/userIssue.service';
import { getCurrentMonth } from '../utils/dates';

const userIssueService: UserIssueService = UserIssueService.getInstance();

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

    /**
     * Calls get user issues service.
     * @returns Array of user issues
     */
    public async getUserIssues(req: any): Promise<IDataIssue> {
        const request: IUserIssuesInput = {
            header: {
                getCredentials: req.header.getCredentials,
                authorization: req.headers.authorization,
            },
            jira_base_url: req.body.jira_base_url,
            jira_url: req.body.jira_url,
            jql: req.body.jql,
            jira_username: req.body.jira_username,
            redmine_id: req.body.redmine_id,
            month: req.body.month,
            year: req.body.year,
        };
        return await userIssueService.getUserIssues(request);
    }

    /**
     * Calls get user issues descriptions service.
     * @returns Array of user issues descriptions
     */
    public async getUserIssuesDescriptions(req: any): Promise<IEvidence> {
        const request: IUserIssuesInput = {
            header: {
                getCredentials: req.header.getCredentials,
                authorization: req.headers.authorization,
            },
            jira_base_url: req.body.jira_base_url,
            jira_url: req.body.jira_url,
            jql: req.body.jql,
            jira_username: req.body.jira_username,
            redmine_id: req.body.redmine_id,
            month: req.body.month,
            year: req.body.year,
        };
        return await userIssueService.getUserIssuesDescriptions(request);
    }

    /**
     * Calls create user issue template service.
     * @returns user issues descriptions with the path to the created template
     */
    public async createTemplate(req: any): Promise<IEvidence> {
        const request: ICreateTemplateInput = {
            header: {
                getCredentials: req.header.getCredentials,
                authorization: req.headers.authorization,
            },
            month: req.body.month,
            year: req.body.year,
            jira_base_url: req.body.jira_base_url,
            jira_url: req.body.jira_url,
            jql: req.body.jql,
            jira_username: req.body.jira_username,
            redmine_id: req.body.redmine_id,
            rewrite_files: req.body.rewrite_files,
        };
        return await userIssueService.createTemplate(request);
    }

    /**
     * Calls create user issue templates from the year service.
     * @returns templates created
     */
    public async createTemplatesYear(req: any): Promise<ICreateTemplateYearOutput> {
        const request: ICreateTemplateInput = {
            header: {
                getCredentials: req.header.getCredentials,
                authorization: req.headers.authorization,
            },
            month: getCurrentMonth(),
            year: req.body.year,
            jira_base_url: req.body.jira_base_url,
            jira_url: req.body.jira_url,
            jql: req.body.jql,
            jira_username: req.body.jira_username,
            redmine_id: req.body.redmine_id,
            rewrite_files: req.body.rewrite_files,
        };
        return await userIssueService.createTemplatesYear(request);
    }

    /**
     * Calls sync redmine user issues service.
     * @returns templates created
     */
    public async syncRedmineUserIssues(req: any): Promise<ISyncRedmineUserIssuesOutput> {
        const request: IGetIssueFromRedmineInput = {
            header: {
                getCredentials: req.header.getCredentials,
                authorization: req.headers.authorization,
            },
            status_id: req.body.status_id,
            limit: req.body.limit,
            offset: req.body.offset,
        };
        return await userIssueService.syncRedmineUserIssues(request);
    }

    /**
     * Maps request and calls getDownloadLinks service.
     * @returns templates created
     */
    public async getDownloadLinks(req: any): Promise<IGetDownloadLinksOutput[]> {
        const request: IGetDownloadLinksInput = {
            header: {
                getCredentials: req.header.getCredentials,
                authorization: req.headers.authorization,
            },
            pageType: req.query.pageType,
            year: req.query.year ? Number(req.query.year) : undefined,
            offset: req.query.offset ? Number(req.query.offset) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
        };
        return await userIssueService.getDownloadLinks(request);
    }

    /**
     * Maps request and calls getDownloadLinks service.
     * @returns file path string to download
     */
    public async downloadTemplate(req: any): Promise<any> {
        const id: string = req.params.id;
        return await userIssueService.downloadTemplate(id);
    }
}
