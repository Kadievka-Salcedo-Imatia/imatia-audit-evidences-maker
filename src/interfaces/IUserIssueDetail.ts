import IUserIssue from './IUserIssue';

export default interface IUserIssueDetail extends IUserIssue {
    screenshot: Buffer;
}
