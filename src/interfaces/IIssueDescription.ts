import IIssueInfoToTakeScreenshot from './IIssueInfoToTakeScreenshot';
export default interface IIssueDescription extends IIssueInfoToTakeScreenshot {
    title: string;
    summary: string;
    closed: string;
    project: string;
}
