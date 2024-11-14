export default interface IUserIssuesInput {
    header: {
        getCredentials: string[];
        authorization: string;
    };
    jira_base_url?: string;
    jira_url?: string;
    jql?: string;
    jira_username?: string;
    redmine_id?: number;
    month: number;
    year: number;
}
