import axios from 'axios';
import getLogger from '../utils/logger';
import IUserIssuesInput from '../interfaces/IUserIssuesInput';

const log = getLogger('RedmineService.service');

export default class RedmineService {
    public static instance: RedmineService;

    /**
     * Returns the single instance of RedmineService.
     * @returns {RedmineService} Singleton instance
     */
    public static getInstance(): RedmineService {
        if (!this.instance) {
            this.instance = new RedmineService();
        }
        return this.instance;
    }

    private readonly REDMINE_URL: string = process.env.REDMINE_URL!;
    private readonly REDMINE_PAGINATION_LIMIT: number = Number(process.env.REDMINE_PAGINATION_LIMIT!);
    private readonly REDMINE_ISSUE_STATUS_ID: string = process.env.REDMINE_ISSUE_STATUS_ID!;

    private axiosInstance = axios.create({
        baseURL: this.REDMINE_URL,
        timeout: 5000,
    });

    /**
     * Returns the user issues as schema
     * @param {IUserIssuesInput} request - request body with redmine_id
     * @returns {Promise<Record<string, any>>} Async user issues as schema
     */
    public async getUserIssues(request: IUserIssuesInput): Promise<Record<string, any>> {
        log.info('Start RedmineService@getUserIssues method with redmine_id: ', request.redmine_id);

        const promiseAxios = this.axiosInstance.get('/issues.json', {
            params: {
                status_id:this.REDMINE_ISSUE_STATUS_ID,
                assigned_to_id:request.redmine_id,
                limit: this.REDMINE_PAGINATION_LIMIT
            },
            headers: {
                Authorization: request.authorization,
            },
        });

        let data: Record<string, any> = {};

        try {
            const response = await promiseAxios;
            data = response.data;
        } catch (error: any) {
            log.error('RedmineService@getUserIssues', error.response.data.errorMessages);
        }

        return data;
    }

}
