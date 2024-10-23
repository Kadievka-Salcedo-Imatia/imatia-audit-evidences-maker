import getLogger from '../utils/logger';
import IUserIssuesInput from '../interfaces/IUserIssuesInput';

const log = getLogger('main.service');

export default class UserIssueService {
    public static instance: UserIssueService;

    /**
     * Returns the single instance of AuthService.
     * @returns {UserIssueService} Singleton instance
     */
    public static getInstance(): UserIssueService {
        if (!this.instance) {
            this.instance = new UserIssueService();
        }
        return this.instance;
    }


    /**
     * Returns the user issues as schema
     * @param {IUserIssuesInput} request - request body with username, startDate and endDate
     * @returns {Promise<IUserIssuesInput>} Async user issues as schema
     */
    public async getUserIssues(request: IUserIssuesInput): Promise<IUserIssuesInput> {
        log.info('Start AuthService@getUserIssues method with email: ', request.userName);

        log.info('Finish AuthService@getUserIssues method');

        return request;
    }


}
