import { PageTypeEnum } from '../../enums/PageTypeEnum';
import IUserIssue from '../../interfaces/IUserIssue';
import IUserIssueDetail from '../../interfaces/IUserIssueDetail';
import { redmineIssuesMock } from './redmineIssuesMock';

const redmineIssue = redmineIssuesMock.issues[0];

export const userIssueMock: IUserIssue = {
    id: redmineIssue.id,
    key: redmineIssue.id,
    self: `${process.env.REDMINE_BASE_URL}/issues/${redmineIssue.id}`,
    type: redmineIssue.tracker.name,
    created: redmineIssue.created_on,
    updated: redmineIssue.updated_on,
    closed: redmineIssue.closed_on,
    assignee: redmineIssue.assigned_to.name,
    assignedToId: redmineIssue.assigned_to.id,
    status: redmineIssue.status.name,
    description: redmineIssue.subject,
    summary: redmineIssue.description,
    project: redmineIssue.project.name,
    projectTypeKey: redmineIssue.project.id,
    creator: redmineIssue.author.name,
    reporter: redmineIssue.author.name,
    pageType: PageTypeEnum.REDMINE,
};

export const userIssueMock2: IUserIssue = {
    id: redmineIssue.id,
    key: redmineIssue.id,
    self: `${process.env.REDMINE_BASE_URL}/issues/${redmineIssue.id}`,
    type: redmineIssue.tracker.name,
    created: redmineIssue.created_on,
    updated: redmineIssue.updated_on,
    closed: undefined,
    assignee: redmineIssue.assigned_to.name,
    assignedToId: redmineIssue.assigned_to.id,
    status: redmineIssue.status.name,
    description: '',
    summary: redmineIssue.description,
    project: redmineIssue.project.name,
    projectTypeKey: redmineIssue.project.id,
    creator: redmineIssue.author.name,
    reporter: redmineIssue.author.name,
    pageType: PageTypeEnum.REDMINE,
};

export const userIssueMock3: IUserIssue = {
    id: '34re354gr43',
    key: 'JX-213',
    self: 'https://www.jira-example.com/browse/JX-213',
    type: 'ERROR',
    created: '10/12/2024',
    updated: '10/12/2024',
    closed: undefined,
    assignee: undefined,
    assignedToId: undefined,
    status: 'backlog',
    description: '',
    summary: 'toggle bar doesn\'t work',
    project: 'Jira project example',
    projectTypeKey: '01',
    creator: 'Jhon Doe',
    reporter: 'Zack Smith',
    pageType: 'JIRA',
};

export const userIssueDetailMock: IUserIssueDetail = {
    id: redmineIssue.id,
    key: redmineIssue.id,
    self: `${process.env.REDMINE_BASE_URL}/issues/${redmineIssue.id}`,
    type: redmineIssue.tracker.name,
    created: redmineIssue.created_on,
    updated: redmineIssue.updated_on,
    closed: redmineIssue.closed_on,
    assignee: redmineIssue.assigned_to.name,
    assignedToId: redmineIssue.assigned_to.id,
    status: redmineIssue.status.name,
    description: redmineIssue.subject,
    summary: redmineIssue.description,
    project: redmineIssue.project.name,
    projectTypeKey: redmineIssue.project.id,
    creator: redmineIssue.author.name,
    reporter: redmineIssue.author.name,
    pageType: PageTypeEnum.REDMINE,
    screenshot: Buffer.from('abc'),
};
