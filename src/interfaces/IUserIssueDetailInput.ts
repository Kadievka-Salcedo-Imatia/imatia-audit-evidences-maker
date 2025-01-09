import IHeader from './IHeader';

export default interface IUserIssueDetailInput extends IHeader {
    jira_username?: string;
    redmine_id?: number;
    issue_id: string;
}
