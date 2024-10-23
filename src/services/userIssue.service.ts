import axios from 'axios';
import getLogger from '../utils/logger';
import IUserIssuesInput from '../interfaces/IUserIssuesInput';
import IDataIssues from '../interfaces/IDataIssues';
import IUserIssue from '../interfaces/IUserIssue';

const log = getLogger('UserIssueService.service');

export default class UserIssueService {
    public static instance: UserIssueService;

    private readonly JIRA_CLOUD_URL = process.env.JIRA_CLOUD_URL!

    private axiosInstance = axios.create({
        baseURL: this.JIRA_CLOUD_URL,
        timeout: 5000,
    });

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
    public async getUserIssues(request: IUserIssuesInput): Promise<IDataIssues> {
        log.info('Start AuthService@getUserIssues method with username: ', request.username);

        const promiseAxios = this.axiosInstance
        .get('/rest/api/2/search', {
            params: {
                jql: `assignee in (${request.username}) AND updated >= ${request.startDate} AND updated <= ${request.endDate}`
            },
            headers: {
                Authorization: request.authorization
            }
        });

        let data: Record<string,any> = {};

        try {
            const response = await promiseAxios;
            data = response.data;
        } catch (error: any) {
            log.error(error.response.data.errorMessages);
        }

        let userIssues: IDataIssues = {
            startAt: data.startAt,
            maxResults: data.maxResults,
            total: data.total,
            issues: data.issues.map((issue: Record<string, any>) => ({
                id: issue.id,
                key: issue.key,
                type: issue.fields.issuetype.name,
                created: issue.fields.created,
                updated: issue.fields.updated,
                assignee: issue.fields.assignee.displayName,
                status: issue.fields.status.name,
                description: issue.fields.description,
                summary: issue.fields.summary,
                comment: {
                    maxResults: 0,
                    total: 0,
                    startAt: 0,
                    comments: []
                },
            }) as unknown as IUserIssue),
        };

        userIssues.issues = await this.getUserIssuesComments(userIssues.issues, request.authorization);

        log.info('Finish UserIssueService@getUserIssues method');
        return userIssues;
    }

    /**
     * Maps the User Issues ids to get the Comments by Issue id
     * @param {IUserIssuesInput} request - request body with username, startDate and endDate
     * @returns {Promise<IUserIssuesInput>} Async user issues as schema
     */
    private async getUserIssuesComments(issues: IUserIssue[], Authorization: string): Promise<IUserIssue[]> {

        let result: IUserIssue[] = [...issues];

        for (let index = 0; index < issues.length; index++) {

            const promiseAxios = this.axiosInstance
                .get(`/rest/api/2/issue/${issues[index].id}`, {
                headers: {
                    Authorization
                }
            });

            let data: Record<string,any> = {};

            try {
                const response = await promiseAxios;
                data = response.data;
            } catch (error: any) {
                log.error(error.response.data.errorMessages);
            }

            if(data.fields.comment.total > 0) {
                result[index].comment.total = data.fields.comment.total;
                result[index].comment.maxResults = data.fields.comment.maxResults;
                result[index].comment.startAt = data.fields.comment.startAt;

                data.fields.comment.comments.forEach((element: Record<string, any>) => {

                    result[index].comment.comments.push({
                        author: element.author.displayName,
                        body: element.body,
                        created: element.created,
                        updated: element.updated,
                    })

                });
                ;
            }
        }

        return result;
    }


}
