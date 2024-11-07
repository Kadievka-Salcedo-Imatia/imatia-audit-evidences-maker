import { PageTypeEnum } from '../../enums/PageTypeEnum';
import IUserIssue from '../../interfaces/IUserIssue';

export const userIssueMock: IUserIssue = {
    id: '94886',
    key: '94886',
    type: 'Tarea',
    created: '2024-10-25',
    updated: '2024-10-25',
    assignee: 'Adrián López Varela',
    assignedToId: '918',
    status: 'Nueva',
    description: 'Integración DPD CH ALAS | Pruebas en PRE',
    summary: '',
    project: 'Integraciones',
    projectTypeKey: '821',
    self: 'https://projects.imatia.com/issues/94886',
    creator: 'Eloy Rodil Carreira',
    reporter: 'Eloy Rodil Carreira',
    pageType: PageTypeEnum.REDMINE,
};
