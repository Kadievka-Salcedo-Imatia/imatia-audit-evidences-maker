import { PageTypeEnum } from '../../enums/PageTypeEnum';
import IDataIssue from '../../interfaces/IDataIssue';
import IEvidence from '../../interfaces/IEvidence';
import IIssueDescription from '../../interfaces/IIssueDescription';
import IUserIssue from '../../interfaces/IUserIssue';
import IUserIssuesInput from '../../interfaces/IUserIssuesInput';
import { MONTHS } from '../../resources/configurations/constants/Months';
import UserIssueService from '../../services/userIssue.service';
import { getUserIssueReqHeaderMock, getUserIssueReqBodyMock } from './getUserIssueRequestMock';

export function getEvidenceInfoMock(issuesMock: IUserIssue[], request?: IUserIssuesInput, jiraPageTypeMock: boolean = false): IEvidence {
    if (!request) {
        request = {
            header: getUserIssueReqHeaderMock.header,
            redmine_id: getUserIssueReqBodyMock.redmine_id,
            month: getUserIssueReqBodyMock.month,
            year: getUserIssueReqBodyMock.year,
        };
    }

    const issuesDescriptionsMock: IIssueDescription[] = [];

    const getDbIssuesResultMock: IDataIssue = {
        month: 'Noviembre',
        total: 3,
        userDisplayName: 'Adrián López Varela',
        project: 'Integraciones',
        issues: issuesMock,
    };

    getDbIssuesResultMock.issues.forEach((issue: IUserIssue) => {
        const title: string = `${issue.type} #${issue.key}: `;
        const summary: string = UserIssueService.getIssueSummary(issue);
        const link: string = issue.self;

        issuesDescriptionsMock.push({
            title,
            summary,
            link,
            pageType: jiraPageTypeMock ? PageTypeEnum.JIRA : PageTypeEnum.REDMINE,
            closed: issue.closed!,
            project: issue.project,
        });
    });

    return {
        project: 'escribir proyecto',
        userDisplayName: 'escribir nombre',
        date: `${MONTHS(request.year)[request.month - 1].days}/${request.month}/${request.year}`,
        month: 'escribir mes',
        evidenceStart: 'En el mes de Noviembre de 2024 se realizaron las siguientes tareas por Jhon Doe: ',
        total: issuesDescriptionsMock.length,
        issues: issuesDescriptionsMock,
    };
}
