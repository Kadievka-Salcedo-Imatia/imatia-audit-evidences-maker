import axios from 'axios';
import getLogger from '../utils/logger';
import IUserIssuesInput from '../interfaces/IUserIssuesInput';
import { MONTHS } from '../resources/configurations/constants/Months';

const log = getLogger('JiraService.service');

export default class JiraService {
    public static instance: JiraService;

    /**
     * Returns the single instance of JiraService.
     * @returns {JiraService} Singleton instance
     */
    public static getInstance(): JiraService {
        if (!this.instance) {
            this.instance = new JiraService();
        }
        return this.instance;
    }

    private readonly JIRA_CLOUD_URL = process.env.JIRA_CLOUD_URL!;

    private axiosInstance = axios.create({
        baseURL: this.JIRA_CLOUD_URL,
        timeout: 5000,
    });

    /**
     * Returns the user issues as schema
     * @param {IUserIssuesInput} request - request body with username, startDate and endDate
     * @returns {Promise<Record<string, any>>} Async user issues as schema
     */
    public async getUserIssues(request: IUserIssuesInput): Promise<Record<string, any>> {
        log.info('Start JiraService@getUserIssues method with username: ', request.username);

        const startDate: string = `${request.year}-${request.month}-01`;
        const endDate: string = `${request.year}-${request.month}-${MONTHS(request.year)[request.month - 1].days}`;

        log.info('Info JiraService@getUserIssues date filters: ', { startDate, endDate });

        const promiseAxios = this.axiosInstance.get('/rest/api/2/search', {
            params: {
                jql: `assignee in (${request.username}) AND updated >= ${startDate} AND updated <= ${endDate}`,
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
            log.error('JiraService@getUserIssues', error.response.data.errorMessages);
        }

        return data;
    }

}
