import IIssueDescription from "./IIssueDescription";

export default interface IEvidences {
    project: string;
    userDisplayName: string;
    date: string;
    month: string;
    evidenceStart: string;
    total: number;
    issues: IIssueDescription[]
}