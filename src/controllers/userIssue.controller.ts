import IUserIssuesInput from '../interfaces/IUserIssuesInput';
import UserIssueService from '../services/userIssue.service';

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
    public async getUserIssues(req: any): Promise<any> {
        const request: IUserIssuesInput = { ...req.body, ...req.headers };
        return await this.userIssueService.getUserIssues(request);
    }

    /**
     * Calls get user issues descriptions service.
     * @returns Array of user issues descriptions
     */
    public async getUserIssuesDescriptions(req: any): Promise<any> {
        const request: IUserIssuesInput = { ...req.body, ...req.headers };
        return await this.userIssueService.getUserIssuesDescriptions(request);
    }

    /**
     * Calls create user issue template service.
     * @returns string with the path to the created template
     */
    public async createTemplate(req: any): Promise<any> {
        const request: IUserIssuesInput = { ...req.body, ...req.headers };
        return await this.userIssueService.createTemplate(request);
    }
}
