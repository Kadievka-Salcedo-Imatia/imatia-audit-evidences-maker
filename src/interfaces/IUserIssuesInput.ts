export default interface IUserIssuesInput {
    authorization: string;
    jira_url?: string;
    jira_username?: string;
    redmine_id?: number;
    month: number;
    year: number;
}
