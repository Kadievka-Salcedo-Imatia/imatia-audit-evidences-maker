import IHeader from './IHeader';

export default interface IUserIssueDetailInput extends IHeader {
    page_type: string;
    issue_id: string;
}
