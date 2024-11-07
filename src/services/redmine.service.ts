import axios from 'axios';
import getLogger from '../utils/logger';
import IRedmineGetIssuesInput from '../interfaces/IRedmineGetIssuesInput';

const log = getLogger('redmine.service.ts');

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

    private readonly REDMINE_BASE_URL: string = process.env.REDMINE_BASE_URL!;
    private readonly REDMINE_PAGINATION_LIMIT: number = Number(process.env.REDMINE_PAGINATION_LIMIT!);
    private readonly REDMINE_ISSUE_STATUS_ID: string = process.env.REDMINE_ISSUE_STATUS_ID!;
    private readonly REDMINE_URL: string = process.env.REDMINE_URL!;

    private axiosInstance = axios.create({
        baseURL: this.REDMINE_BASE_URL,
        timeout: 5000,
    });

    /**
     * Returns the user issues as schema
     * @param {IUserIssuesInput} request - request body with redmine_id
     * @returns {Promise<Record<string, any>>} Async user issues as schema
     */
    public async getUserIssues(request: IRedmineGetIssuesInput): Promise<Record<string, any>> {
        log.info('Start RedmineService@getUserIssues method with params: ', { status_id: request.status_id, limit: request.limit, offset: request.offset });

        const promiseAxios = this.axiosInstance.get(this.REDMINE_URL, {
            params: {
                status_id: request.status_id || this.REDMINE_ISSUE_STATUS_ID,
                limit: request.limit || this.REDMINE_PAGINATION_LIMIT,
                offset: request.offset || '0',
            },
            headers: {
                Authorization: request.authorization!,
            },
        });

        let data: Record<string, any> = {};

        try {
            const response = await promiseAxios;
            data = response.data;
        } catch (error: any) {
            log.error('RedmineService@getUserIssues', error.response.data.errorMessages);
        }

        log.info('Finish RedmineService@getUserIssues method');

        return data;
    }
}
