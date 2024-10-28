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
     * Returns the user issues from jira
     * @param {IUserIssuesInput} request - request body with jira_username, startDate and endDate
     * @returns {Promise<Record<string, any>>} Async user issues data from jira
     */
    public async getUserIssues(request: IUserIssuesInput): Promise<Record<string, any>> {
        log.info('Start JiraService@getUserIssues method with jira_username: ', request.jira_username);

        const startDate: string = `${request.year}-${request.month}-01`;
        const endDate: string = `${request.year}-${request.month}-${MONTHS(request.year)[request.month - 1].days}`;

        log.info('Info JiraService@getUserIssues date filters: ', { startDate, endDate });

        const promiseAxios = this.axiosInstance.get('/rest/api/2/search', {
            params: {
                jql: `assignee in (${request.jira_username}) AND updated >= ${startDate} AND updated <= ${endDate}`,
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
