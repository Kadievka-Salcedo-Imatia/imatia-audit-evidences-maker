import IHeader from './IHeader';

export default interface IGetIssueFromRedmineInput extends IHeader {
    status_id?: string;
    limit?: number;
    offset?: number;
}
