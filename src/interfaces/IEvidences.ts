import IIssueDescription from "./IIssueDescription";

export default interface IEvidences {
    evidenceStart: string;
    total: number;
    issues: IIssueDescription[]
}