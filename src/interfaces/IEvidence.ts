import IIssueDescription from "./IIssueDescription";

export default interface IEvidence {
    project: string;
    userDisplayName: string;
    date: string;
    month: string;
    evidenceStart: string;
    total: number;
    issues?: IIssueDescription[];
    path?: string;
}