import axios from 'axios';
import getLogger from '../utils/logger';
import IUserIssuesInput from '../interfaces/IUserIssuesInput';
import IDataIssues from '../interfaces/IDataIssues';
import IUserIssue from '../interfaces/IUserIssue';
import { MONTHS } from '../resources/configurations/constants/Months';
import IComment from '../interfaces/IComment';
import IIssueDescription from '../interfaces/IIssueDescription';
import IEvidences from '../interfaces/IEvidences';
import { formatDateTime } from '../utils/dates';

const log = getLogger('UserIssueService.service');

export default class UserIssueService {
    public static instance: UserIssueService;

    private readonly JIRA_CLOUD_URL = process.env.JIRA_CLOUD_URL!

    private axiosInstance = axios.create({
        baseURL: this.JIRA_CLOUD_URL,
        timeout: 5000,
    });

    /**
     * Returns the single instance of UserIssueService.
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
     * @returns {Promise<IDataIssues>} Async user issues as schema
     */
    public async getUserIssues(request: IUserIssuesInput): Promise<IDataIssues> {
        log.info('Start UserIssueService@getUserIssues method with username: ', request.username);

        const startDate: string = `${request.year}-${request.month}-01`;
        const endDate: string = `${request.year}-${request.month}-${MONTHS(request.year)[request.month-1].days}`;

        log.info(' UserIssueService@getUserIssues date filters: ', {startDate, endDate});

        const promiseAxios = this.axiosInstance
        .get('/rest/api/2/search', {
            params: {
                jql: `assignee in (${request.username}) AND updated >= ${startDate} AND updated <= ${endDate}`
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
            month: MONTHS()[request.month-1].displayName,
            startAt: data.startAt,
            maxResults: data.maxResults,
            total: data.total,
            userDisplayName: '',
            issues: data.issues.map((issue: Record<string, any>) => ({
                id: issue.id,
                key: issue.key,
                self: issue.self,
                type: issue.fields.issuetype.name,
                created: issue.fields.created,
                updated: issue.fields.updated,
                assignee: issue.fields.assignee.displayName,
                status: issue.fields.status.name,
                description: issue.fields.description,
                summary: issue.fields.summary,
                project: issue.fields.project.name,
                projectTypeKey: issue.fields.project.projectTypeKey,
                comment: {
                    maxResults: 0,
                    total: 0,
                    startAt: 0,
                    comments: []
                },
            }))
        };

        userIssues.issues = await this.getUserIssuesComments(userIssues.issues, request.authorization);
        userIssues.userDisplayName = userIssues.issues[0]?.assignee;

        log.info('Finish UserIssueService@getUserIssues method');
        return userIssues;
    }

    /**
     * Maps the User Issues ids to get the Comments by Issue id
     * @param {IUserIssue[]} issues - user issues
     * @param {string} Authorization - Authorization Header Basic value
     * @returns {Promise<IUserIssuesInput>} Async user issues as schema
     */
    private async getUserIssuesComments(issues: IUserIssue[], Authorization: string): Promise<IUserIssue[]> {
        log.info(' Start UserIssueService@getUserIssuesComments method');
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
        log.info(' Finish UserIssueService@getUserIssuesComments method');
        return result;
    }

    /**
     * Maps the User Issues to create Evidence Description for the document
     * @param {IUserIssuesInput[]} request - the same request to get user issues
     * @returns {Promise<IEvidences>} Async promise to get Evidence description for the Word Template
     */
    public async getUserIssuesDescriptions(request: IUserIssuesInput): Promise<IEvidences> {
        log.info('Start UserIssueService@getUserIssuesDescriptions with username: ', request.username);
        const userIssues: IDataIssues = await this.getUserIssues(request);

        const evidenceStart: string = `En el mes de ${userIssues.month} de ${request.year} se realizaron las siguientes tareas por ${userIssues.userDisplayName}: `;

        let issuesDescription: IIssueDescription[] = [];

        userIssues.issues.forEach((issue: IUserIssue) => {

            const issueDescription: string = `${issue.type} ${issue.key}: ${issue.summary} del proyecto ${issue.project}. Se trataba de ${issue.description} Esta tarea fue creada el día ${formatDateTime(issue.created).date} a las ${formatDateTime(issue.created).time} y su ultima actualización fue el día ${formatDateTime(issue.updated).date} a las ${formatDateTime(issue.updated).time} con status ${issue.status}. En el siguiente enlace se puede consultar más a detalle esta tarea: ${issue.self}.`;

            const commentStory: IComment[] = [];

            issue.comment.comments.forEach((comment: IComment) => {
                commentStory.push({...comment,
                    created: `${formatDateTime(comment.created).date} a las ${formatDateTime(comment.created).time}`,
                    updated: `${formatDateTime(comment.updated).date} a las ${formatDateTime(comment.updated).time}`
                });
            });

            issuesDescription.push({issue: issueDescription, commentStory})
        })

        log.info('Finish UserIssueService@getUserIssuesDescriptions method');

        return {
            evidenceStart,
            total: userIssues.total,
            issues: issuesDescription,
        }

    }

}
