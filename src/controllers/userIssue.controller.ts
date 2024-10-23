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

    private mainService: UserIssueService = UserIssueService.getInstance();

    /**
     *.
     * @returns Welcome message
     */
    public async sendWelcome(): Promise<any> {
        return "Welcome";
    }

    /**
     * Calls get users service.
     * @returns users - Array of user's names
     */
    public async getUserIssues(req: any): Promise<any> {
        console.log(req)
        const request: IUserIssuesInput = { ...req.body, ...req.headers };
        return await this.mainService.getUserIssues(request);
    }


}
