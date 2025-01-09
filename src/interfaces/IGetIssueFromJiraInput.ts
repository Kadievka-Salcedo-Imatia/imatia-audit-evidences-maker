export default interface IGetIssueFromJiraInput {
    authorization: string;
    jira_base_url?: string;
    jira_url?: string;
    jql?: string;
    jira_username?: string;
    startDate?: string;
    endDate?: string;
}
