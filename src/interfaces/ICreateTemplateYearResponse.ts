import IEvidenceShort from './IEvidenceShort';

export default interface ICreateTemplateYearResponse {
    userDisplayName: string;
    evidencesCreated: {
        total: number;
        evidences: IEvidenceShort[];
    };
    evidencesWithErrors: {
        total: number;
        evidences: Array<Record<string, string>>;
    };
}
