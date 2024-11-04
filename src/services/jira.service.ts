import axios, { AxiosRequestConfig } from 'axios';
import getLogger from '../utils/logger';
import IUserIssuesInput from '../interfaces/IUserIssuesInput';
import { MONTHS } from '../resources/configurations/constants/Months';

const log = getLogger('jira.service.ts');

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

    private readonly JIRA_CLOUD_URL: string = process.env.JIRA_CLOUD_URL!;
    private readonly DEFAULT_JQL: string = process.env.DEFAULT_JQL!;
    private readonly JIRA_REST_API_2_SEARCH_URL: string = process.env.JIRA_REST_API_2_SEARCH_URL!;
    private readonly TIMEOUT: number = 5000;

    /**
     * Returns the user issues from jira
     * @param {IUserIssuesInput} request - request body with jira_username, startDate and endDate
     * @returns {Promise<Record<string, any>>} Async user issues data from jira
     */
    public async getUserIssues(request: IUserIssuesInput): Promise<Record<string, any>> {
        log.info('Start JiraService@getUserIssues method with params:', request);

        const startDate: string = `${request.year}-${request.month}-01`;
        const endDate: string = `${request.year}-${request.month}-${MONTHS(request.year)[request.month - 1].days}`;

        log.info(' Info JiraService@getUserIssues date filters:', { startDate, endDate });

        let axiosInstance: any;

        const jql: string = request.jql
            ? request.jql
            : this.DEFAULT_JQL.replace('{{jira_username}}', request.jira_username!).replace('{{startDate}}', startDate).replace('{{endDate}}', endDate);

        if (Boolean(request.jira_base_url)) {
            axiosInstance = axios.create({
                baseURL: request.jira_base_url,
                timeout: this.TIMEOUT,
            });
        } else {
            axiosInstance = axios.create({
                baseURL: this.JIRA_CLOUD_URL,
                timeout: this.TIMEOUT,
            });
        }

        const axiosConfig: AxiosRequestConfig<any> = {
            params: {
                jql,
            },
            headers: {
                Authorization: request.authorization,
            },
        };

        const url: string = request.jira_url ? request.jira_url : this.JIRA_REST_API_2_SEARCH_URL;

        let data: Record<string, any> = {};

        let response: any;

        try {
            const promiseAxios = await axiosInstance.get(url, axiosConfig);
            response = await promiseAxios;
            data = response.data;
        } catch (error: any) {
            log.error('JiraService@getUserIssues', { error, response });
            throw error;
        }

        log.info('Finish JiraService@getUserIssues');
        return data;
    }
}
