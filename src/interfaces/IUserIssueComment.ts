import IComment from './IComment';

export default interface IUserIssueComment {
    maxResults: number;
    total: number;
    startAt: number;
    comments: IComment[];
}
