import IHeader from './IHeader';

export default interface IUserIssuesInput extends IHeader {
    jira_base_url?: string;
    jira_url?: string;
    jql?: string;
    jira_username?: string;
    redmine_id?: number;
    month: number;
    year: number;
}
