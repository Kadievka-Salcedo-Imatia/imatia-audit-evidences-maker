import IUserIssue from './IUserIssue';

export default interface IDataIssue {
    total: number;
    issues: IUserIssue[];
    month: string;
    project: string;
    userDisplayName: string;
}
