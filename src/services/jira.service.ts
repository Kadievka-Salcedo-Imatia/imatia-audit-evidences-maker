import axios, { AxiosRequestConfig } from 'axios';
import getLogger from '../utils/logger';
import IGetIssueFromJiraInput from '../interfaces/IGetIssueFromJiraInput';

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
     * @param {IGetIssueFromJiraInput} getIssueInput - request body with jira_username, jira_base_url, jira_url, jql, month, year
     * @returns {Promise<Record<string, any>>} Async user issues data from jira
     */
    public async getUserIssues(getIssueInput: IGetIssueFromJiraInput): Promise<Record<string, any>> {
        log.info('Start JiraService@getUserIssues method with params:', getIssueInput);

        let axiosInstance: any;

        const jql: string = getIssueInput.jql
            ? getIssueInput.jql
            : this.DEFAULT_JQL.replace('{{jira_username}}', getIssueInput.jira_username!)
                  .replace('{{startDate}}', getIssueInput.startDate)
                  .replace('{{endDate}}', getIssueInput.endDate);

        if (Boolean(getIssueInput.jira_base_url)) {
            axiosInstance = axios.create({
                baseURL: getIssueInput.jira_base_url,
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
                Authorization: getIssueInput.authorization,
            },
        };

        const url: string = getIssueInput.jira_url ? getIssueInput.jira_url : this.JIRA_REST_API_2_SEARCH_URL;

        let data: Record<string, any> = {};

        try {
            const promiseAxios = await axiosInstance.get(url, axiosConfig);
            data = promiseAxios.data;
        } catch (error: any) {
            log.error('JiraService@getUserIssues', { error });
            throw error;
        }

        log.info('Finish JiraService@getUserIssues');
        return data;
    }
}
