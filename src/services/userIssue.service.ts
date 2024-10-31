import { Document, ExternalHyperlink, FileChild, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import fs from 'fs';
import path from 'path';
import getLogger from '../utils/logger';
import IUserIssuesInput from '../interfaces/IUserIssuesInput';
import IDataIssue from '../interfaces/IDataIssue';
import IUserIssue from '../interfaces/IUserIssue';
import { MONTHS } from '../resources/configurations/constants/Months';
import IIssueDescription from '../interfaces/IIssueDescription';
import IEvidence from '../interfaces/IEvidence';
import { formatDateTime } from '../utils/dates';
import puppeteer, { Browser } from 'puppeteer';
import ICreateTemplateYearResponse from '../interfaces/ICreateTemplateYearResponse';
import JiraService from './jira.service';
import RedmineService from './redmine.service';
import { PageTypeEnum } from '../enums/PageTypeEnum';
import IRedmineGetIssuesInput from '../interfaces/IRedmineGetIssuesInput';
import UserIssueModel from '../models/UserIssueModel';
import BaseErrorClass from '../resources/configurations/classes/BaseErrorClass';
import INTERNAL_ERROR_CODES from '../resources/configurations/constants/InternalErrorCodes';
import { getPagesNumber } from '../utils/pagination';
import DatabaseService from './database.service';
import ISyncRedmineUserIssuesOutput from '../interfaces/ISyncRedmineUserIssuesOutput';
import { FindCursor } from 'mongodb';
import ICreateTemplateInput from '../interfaces/ICreateTemplateInput';

const log = getLogger('userIssue.service.ts');

const databaseService: DatabaseService = DatabaseService.getInstance();

export default class UserIssueService {
    public static instance: UserIssueService;

    /**
     * Returns the single instance of UserIssueService.
     * @returns {UserIssueService} Singleton instance
     */
    public static getInstance(): UserIssueService {
        if (!this.instance) {
            this.instance = new UserIssueService();
        }
        return this.instance;
    }

    private readonly JIRA_CLOUD_URL: string = process.env.JIRA_CLOUD_URL!;
    private readonly REDMINE_URL: string = process.env.REDMINE_URL!;

    private readonly FONT: string = 'Segoe UI';

    private jiraService: JiraService = JiraService.getInstance();

    private redmineService: RedmineService = RedmineService.getInstance();

    /**
     * Creates a new user issue in DB.
     * @param {Record<string, any>} redmineIssue User issue data from redmine endpoint
     * @returns {Promise<IUserIssue>} IUserIssue
     */
    public async createUserIssue(redmineIssue: Record<string, any>): Promise<Record<string, any>> {
        log.info('  Start UserIssueService@createUserIssue method with id:', redmineIssue.id);

        const userIssueModel: UserIssueModel = new UserIssueModel({
            id: redmineIssue.id,
            key: redmineIssue.id,
            self: `${this.REDMINE_URL}/issues/${redmineIssue.id}`,
            type: redmineIssue.tracker.name,
            created: redmineIssue.created_on,
            updated: redmineIssue.updated_on,
            closed: redmineIssue.closed_on,
            assignee: redmineIssue.assigned_to?.name || '',
            assignedToId: redmineIssue.assigned_to?.id || '',
            status: redmineIssue.status.name,
            description: redmineIssue.subject,
            summary: redmineIssue.description,
            project: redmineIssue.project.name,
            projectTypeKey: redmineIssue.project.id,
            creator: redmineIssue.author.name,
            reporter: redmineIssue.author.name,
            pageType: PageTypeEnum.REDMINE,
        });

        try {
            await databaseService.connect('user_issues');
            const usersCollection = databaseService.collections.user_issues;
            await usersCollection.insertOne(userIssueModel.mapForDB());
        } catch (error) {
            log.error('  Error UserIssueService@createUserIssue method', error);
            throw new BaseErrorClass(INTERNAL_ERROR_CODES.GENERAL_UNKNOWN);
        } finally {
            await databaseService.disconnect();
        }

        log.info('  Finish UserIssueService@createUserIssue method');
        return userIssueModel.mapForDB();
    }

    /**
     * Method to map data issues and save them to the database
     * @param {IUserIssuesInput} request - request body
     * @returns {Promise<Record<string, any>>} Async user issues as schema
     */
    public async getIssuesFromRedmineAndSave(request: IRedmineGetIssuesInput): Promise<Record<string, any>> {
        log.info(' Start UserIssueService@getAndSaveIssues method');
        const data = await this.redmineService.getUserIssues(request);

        let createdRegisters: number = 0;

        for (const issue of data.issues) {
            try {
                await this.createUserIssue(issue);
                createdRegisters++;
            } catch (error) {
                log.error(' Error UserIssueService@getIssuesFromRedmineAndSave method', error);
            }
        }

        log.info(' Finish UserIssueService@getAndSaveIssues method');
        return { ...data, createdRegisters };
    }

    /**
     * Method to map all issues in redmine using the pagination
     * @param {IUserIssuesInput} request - request body with redmine_id
     * @returns {Promise<Record<string, any>>} Async user issues as schema
     */
    public async syncRedmineUserIssues(request: IRedmineGetIssuesInput): Promise<ISyncRedmineUserIssuesOutput> {
        log.info('Start UserIssueService@mapUserIssuesAndSaveInDB method');

        let createdRegisters = 0;

        const startTime = performance.now();

        let response = await this.getIssuesFromRedmineAndSave(request);
        createdRegisters = response.createdRegisters;

        let offset: string = request.offset!;

        const iterations: number = getPagesNumber(response.total_count, response.limit);

        log.info(' UserIssueService@mapUserIssuesAndSaveInDB iterations:', iterations);

        for (let index = 1; index < iterations; index++) {
            offset += request.limit;
            response = await this.getIssuesFromRedmineAndSave({ ...request, offset });
            createdRegisters += response.createdRegisters;
        }

        const endTime = performance.now();

        const time = `${endTime - startTime} ms`;

        log.info(`Finish UserIssueService@mapUserIssuesAndSaveInDB method in: ${endTime - startTime} ms`);

        return {
            createdRegisters,
            time,
        };
    }

    /**
     * Gets user issues by redmine id.
     * @param {number} assignedToId The user redmine_id
     * @param {string} startDate
     * @param {string} endDate
     * @returns {Promise<any>} user issues information comes from the database
     */
    public async getDbUserIssues(assignedToId: number, startDate: Date, endDate: Date): Promise<FindCursor> {
        log.info('  Start UserIssueService@getDbUserIssues method with params:', { assignedToId, startDate, endDate });
        let dbUserIssues: FindCursor;
        try {
            await databaseService.connect('user_issues');
            const usersCollection = databaseService.collections.user_issues;

            dbUserIssues = await usersCollection
                .find({
                    assignedToId,
                    $or: [{ updated: { $gte: startDate, $lte: endDate } }, { closed: { $gte: startDate, $lte: endDate } }],
                })
                .sort({ updated: -1, closed: -1 })
                .toArray();
        } catch (error) {
            log.error('  Error UserIssueService@getDbUserIssues method', error);
            throw new BaseErrorClass(INTERNAL_ERROR_CODES.GENERAL_UNKNOWN);
        } finally {
            await databaseService.disconnect();
        }
        log.info('  Finish UserIssueService@getDbUserIssues method');
        return dbUserIssues;
    }

    /**
     * Returns the user issues as schema
     * @param {IUserIssuesInput} request - request body with jira_username, redmine_id, startDate and endDate
     * @returns {Promise<IDataIssue>} Async user issues as schema
     */
    public async getUserIssues(request: IUserIssuesInput): Promise<IDataIssue> {
        log.info('  Start UserIssueService@getUserIssues method with params:', {
            jira_username: request.jira_username,
            redmine_id: request.redmine_id,
            year: request.year,
            month: request.month,
        });

        const startDate: string = `${request.year}-${request.month}-01`;
        const endDate: string = `${request.year}-${request.month}-${MONTHS(request.year)[request.month - 1].days}`;

        let data: Record<string, any> = {};

        const userIssue: IDataIssue = {
            month: MONTHS()[request.month - 1].displayName,
            total: 0,
            userDisplayName: '',
            project: '',
            issues: [],
        };

        if (request.jira_username) {
            data = await this.jiraService.getUserIssues(request);

            (userIssue.total = data.total),
                (userIssue.issues = data.issues.map((issue: Record<string, any>) => ({
                    id: issue.id,
                    key: issue.key,
                    self: Boolean(request.jira_url) ? request.jira_url + '/browse/' + issue.key : this.JIRA_CLOUD_URL + '/browse/' + issue.key,
                    type: issue.fields.issuetype.name,
                    created: issue.fields.created,
                    updated: issue.fields.updated,
                    assignee: issue.fields.assignee.displayName,
                    status: issue.fields.status.name,
                    description: issue.fields.description,
                    summary: issue.fields.summary,
                    project: issue.fields.project.name,
                    projectTypeKey: issue.fields.project.projectTypeKey,
                    pageType: PageTypeEnum.JIRA,
                }))),
                (userIssue.userDisplayName = userIssue.issues[0]?.assignee);
            userIssue.project = userIssue.issues[0]?.project;
        }

        if (request.redmine_id) {
            data = await this.getDbUserIssues(request.redmine_id, new Date(startDate), new Date(endDate));

            if (data.length > 0) {
                userIssue.total += data.length;
                userIssue.userDisplayName = userIssue.userDisplayName ? userIssue.userDisplayName : data[0].assignee;
                userIssue.project = userIssue.project ? userIssue.project : data[0].project;

                data.forEach((element: IUserIssue) => {
                    userIssue.issues.push(element);
                });
            }
        }

        log.info('  Finish UserIssueService@getUserIssues method');
        return userIssue;
    }

    /**
     * Maps the User Issues to create Evidence Description for the document
     * @param {IUserIssuesInput[]} request - the same request to get user issues
     * @returns {Promise<IEvidence>} Async promise to get Evidence description for the Word Template
     */
    public async getUserIssuesDescriptions(request: IUserIssuesInput): Promise<IEvidence> {
        log.info('Start UserIssueService@getUserIssuesDescriptions with jira_username:', request.jira_username);
        const userIssue: IDataIssue = await this.getUserIssues(request);

        const evidenceStart: string = `En el mes de ${userIssue.month} de ${request.year} se realizaron las siguientes tareas por ${userIssue.userDisplayName}: `;

        const issuesDescription: IIssueDescription[] = [];

        userIssue.issues.forEach((issue: IUserIssue) => {
            const title: string = `${issue.type} #${issue.key}: `;
            const summary: string = this.getIssueSummary(issue);
            const link: string = issue.self;

            issuesDescription.push({
                title,
                summary,
                link,
                pageType: issue.pageType,
                closed: issue.closed!,
            });
        });

        log.info('Finish UserIssueService@getUserIssuesDescriptions method');

        return {
            project: userIssue.project,
            userDisplayName: userIssue.userDisplayName,
            date: `${MONTHS(request.year)[request.month - 1].days}/${request.month}/${request.year}`,
            month: userIssue.month.toLocaleUpperCase(),
            evidenceStart,
            total: userIssue.total,
            issues: issuesDescription,
        };
    }

    /**
     * Creates Evidence Template Doc
     * @param {IUserIssuesInput[]} request - the same request to get user issues
     * @returns {Promise<IEvidence>} Async promise to get Evidence description for the Word Template
     */
    public async createTemplate(request: ICreateTemplateInput): Promise<IEvidence> {
        log.info('Start UserIssueService@createTemplate with params:', { jira_username: request.jira_username, redmine_id: request.redmine_id });
        const startTime = performance.now();

        const evidence: IEvidence = await this.getUserIssuesDescriptions(request);

        if (!evidence.issues || evidence.issues.length === 0) {
            return evidence;
        }

        const newFilePathYear =
            __dirname + path.sep + '..' + path.sep + 'templates' + path.sep + 'EVIDENCIAS ' + request.year + path.sep + evidence.userDisplayName + path.sep + evidence.month;

        if (!fs.existsSync(newFilePathYear)) {
            fs.mkdirSync(newFilePathYear, { recursive: true });
        }

        const newFilePath =
            __dirname + path.sep + '..' + path.sep + 'templates' + path.sep + 'EVIDENCIAS ' + request.year + path.sep + evidence.userDisplayName + path.sep + evidence.month;

        if (!fs.existsSync(newFilePath)) {
            fs.mkdirSync(newFilePath, { recursive: true });
        }

        const newFileName = newFilePath + path.sep + 'Plantilla Evidencias - ' + evidence.month.toLowerCase() + '.docx';

        if (fs.existsSync(newFileName)) {
            if (Boolean(request.rewrite_files)) {
                fs.rmSync(newFileName);
            } else {
                return evidence;
            }
        }

        const table1 = new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Proyecto:',
                                            size: 20,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            width: {
                                size: 90,
                                type: WidthType.PERCENTAGE,
                            },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Plataforma Colaboración Corporativa',
                                            size: 20,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const table2 = new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Nombre:',
                                            size: 20,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: evidence.userDisplayName,
                                            size: 20,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Rol:',
                                            size: 20,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Programador',
                                            size: 20,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const table3 = new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Fecha:',
                                            size: 20,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: evidence.date,
                                            size: 20,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const table4 = new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Breve descripción de la actividad:',
                                            size: 20,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const table5 = new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: this.getIssuesParagraphs(evidence),
                        }),
                    ],
                }),
            ],
        });

        const table6 = new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Evidencia Técnica',
                                            size: 20,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const children = [
            table1,
            new Paragraph(''),
            table2,
            new Paragraph(''),
            table3,
            new Paragraph(''),
            table4,
            new Paragraph(''),
            table5,
            new Paragraph(''),
            table6,
            new Paragraph(''),
            ,
        ];

        if (!Boolean(request.jira_url)) {
            // can not take screenshots of external jira boards because they could have custom authentication with phone number and other information
            const images: Paragraph[] = await this.splitIssuesByTypeAndGetImages(evidence, request);

            images.forEach((image) => {
                children.push(image);
            });
        }

        const doc = new Document({
            sections: [
                {
                    children: children as FileChild[],
                },
            ],
        });

        const newBuffer = await Packer.toBuffer(doc);
        fs.writeFileSync(newFileName, newBuffer);

        const endTime = performance.now();
        log.info(`Finish UserIssueService@createTemplate path: ${newFileName} in time: ${endTime - startTime} ms:`);

        return evidence;
    }

    /**
     * Creates Evidence Template Doc of the year
     * @param {IUserIssuesInput[]} request - the request to get user issues
     * @returns {Promise<ICreateTemplateYearResponse>} Async promise to get Evidence description for the Word Template
     */
    public async createTemplatesYear(request: ICreateTemplateInput): Promise<ICreateTemplateYearResponse> {
        log.info('Start UserIssueService@createTemplatesYear method');
        const startTime = performance.now();

        const response: ICreateTemplateYearResponse = {
            userDisplayName: '',
            evidencesCreated: {
                total: 0,
                evidences: [],
            },
            evidencesWithErrors: {
                total: 0,
                evidences: [],
            },
        };

        for (let index = 1; index <= request.month; index++) {
            let evidence: IEvidence;

            try {
                evidence = await this.createTemplate({ ...request, month: index });
            } catch (error: any) {
                response.evidencesWithErrors.evidences.push({
                    date: `${MONTHS(request.year)[index - 1].displayName} de ${request.year}`,
                    errorMessage: error.message,
                });
                response.evidencesWithErrors.total++;
                continue;
            }

            if (index === 1) {
                response.userDisplayName = evidence.userDisplayName;
            }

            response.evidencesCreated.evidences.push({
                project: evidence.project,
                date: evidence.date,
                month: evidence.month,
                total: evidence.total,
                path: evidence.path,
            });
            response.evidencesCreated.total++;
        }

        const endTime = performance.now();
        log.info(`Finish UserIssueService@createTemplatesYear method in: ${endTime - startTime} ms`);
        return response;
    }

    /**
     * Split evidence by page type to login each one
     * @param {IEvidence} evidence
     * @param {ICreateTemplateInput} request
     * @returns {Promise<Paragraph[]>} Paragrafs in the Template with the processed Images Buffers
     */
    private async splitIssuesByTypeAndGetImages(evidence: IEvidence, request: ICreateTemplateInput): Promise<Paragraph[]> {
        const images: Paragraph[] = [];

        if (!evidence.issues || evidence.issues.length === 0) {
            return images;
        }

        for (const pageType in PageTypeEnum) {
            if (PageTypeEnum.hasOwnProperty(pageType)) {
                const issues: IIssueDescription[] = evidence.issues.filter((issue) => {
                    return issue.pageType === pageType;
                });

                if (issues.length === 0) {
                    continue;
                }
                const result = await this.getEvidenceImages({ ...evidence, issues }, request);

                images.concat(result);
            }
        }

        return images;
    }

    /**
     * Maps the User Issues Description to Write the Document Template
     * @param {IEvidence} evidences - evidence text to display in the template
     * @returns {Paragraph[]} returns the list of paragraphs
     */
    private getIssuesParagraphs(evidences: IEvidence): Paragraph[] {
        log.info(' Start UserIssueService@getIssues method');
        const paragraphs: Paragraph[] = [
            new Paragraph({
                children: [
                    new TextRun({
                        text: evidences.evidenceStart,
                        size: 20,
                        font: this.FONT,
                    }),
                ],
            }),
        ];

        evidences.issues!.forEach((element) => {
            paragraphs.push(
                new Paragraph(''),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: element.title,
                            bold: true,
                            size: 20,
                            font: this.FONT,
                        }),
                        new TextRun({
                            text: element.summary,
                            size: 20,
                            font: this.FONT,
                        }),
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: element.link,
                                    style: 'Hyperlink',
                                }),
                            ],
                            link: element.link,
                        }),
                    ],
                }),
            );
        });
        log.info(' Finish UserIssueService@getIssues method');
        return paragraphs;
    }

    private getIssueSummary(issue: IUserIssue): string {
        if (issue.pageType === PageTypeEnum.JIRA) {
            return `${issue.summary} del proyecto ${issue.project}. Se trataba de ${issue.description} Esta tarea fue creada el día ${formatDateTime(issue.created).date} a las ${formatDateTime(issue.created).time} y su ultima actualización fue el día ${formatDateTime(issue.updated).date} a las ${formatDateTime(issue.updated).time} con status ${issue.status}. En el siguiente enlace se puede consultar más a detalle esta tarea: `;
        }
        return `${issue.summary} del proyecto ${issue.project}. Se trataba de ${issue.description}. Esta tarea fue creada el día ${formatDateTime(issue.created).date} a las ${formatDateTime(issue.created).time} y su status fue ${issue.status} el día ${formatDateTime(issue.updated).date} a las ${formatDateTime(issue.updated).time}. En el siguiente enlace se puede consultar más a detalle esta tarea: `;
    }

    /**
     * Goes to Jira Cloud url, makes login, and takes an screenshot of the issue
     * @param {IIssueDescription} issue - Jira Cloud url
     * @param {Browser} browser - Browser instance
     * @param {boolean} isLogin - indicates if its the first time going to take screenshot, it needs login first
     * @param {string} authorization - authorization token to make login
     * @returns {Promise<Buffer>} returns the image buffer to be copied into the template
     */
    private async takeScreenshot(issue: IIssueDescription, browser: Browser, isLogin: boolean, authorization: string): Promise<Buffer> {
        log.info('  Start UserIssueService@getIssues takeScreenshot with params:', { id: issue.title, url: issue.link });
        const page = await browser.newPage();

        if (issue.pageType === PageTypeEnum.JIRA) {
            await page.setViewport({ width: 1200, height: 1000 });
        }

        if (issue.pageType === PageTypeEnum.REDMINE) {
            await page.setViewport({ width: 1600, height: 1400 });
        }

        await page.goto(issue.link, { waitUntil: 'load' });

        if (isLogin) {
            const base64Credentials = authorization.split(' ')[1];

            const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');

            const [username, password] = credentials.split(':');

            if (issue.pageType === PageTypeEnum.JIRA) {
                await page.type('input[id="login-form-username"]', username);

                await page.type('input[id="login-form-password"]', password);

                await page.focus('input[id=login-form-submit]');

                await page.click('input[id=login-form-submit]');

                await page.waitForNavigation();

                await page.evaluate(() => {
                    window.scrollTo(0, 0);
                    window.addEventListener('scroll', () => {
                        window.scrollTo(0, 0);
                    });
                });
            }

            if (issue.pageType === PageTypeEnum.REDMINE) {
                await page.type('input[id="username"]', username);

                await page.type('input[id="password"]', password);

                await page.focus('input[id=login-submit]');

                await page.click('input[id=login-submit]');

                await page.waitForNavigation();

                await page.evaluate(() => {
                    window.scrollTo(0, 1400);
                    window.addEventListener('scroll', () => {
                        window.scrollTo(0, 1600);
                    });
                });
            }
        }

        const screenshotArray: Uint8Array = await page.screenshot();
        const screenshotBuffer: Buffer = Buffer.from(screenshotArray);

        await page.close();

        log.info('  Finish UserIssueService@getIssues takeScreenshot');
        return screenshotBuffer as Buffer;
    }

    /**
     * Maps the User Issues Description to get Evidence Images for the Document Template
     * @param {IEvidence[]} evidence - issue data array
     * @param {IUserIssuesInput} request - authorization token to make login
     * @returns {Promise<Buffer>} returns the image buffer to be copied into the template
     */
    private async getEvidenceImages(evidence: IEvidence, request: IUserIssuesInput): Promise<Paragraph[]> {
        log.info(' Start UserIssueService@getEvidenceImages method');
        const browser: Browser = await puppeteer.launch({ headless: false }); // to display the browser: { headless: false }

        const paragraphs: Paragraph[] = [];

        for (let index = 0; index < evidence.issues!.length; index++) {
            let imageBase64Data;

            try {
                imageBase64Data = await this.takeScreenshot(evidence.issues![index], browser, index === 0, request.authorization);
            } catch (error) {
                log.error(' Error UserIssueService@getEvidenceImages trying to take screenshot');
                continue;
            }

            paragraphs.push(
                new Paragraph({
                    style: 'height: 100%',
                    children: [
                        new TextRun({
                            text: evidence.issues![index].title,
                            bold: true,
                            size: 20,
                            font: this.FONT,
                        }),
                        new ImageRun({
                            type: 'jpg',
                            data: imageBase64Data,
                            transformation: {
                                width: 600,
                                height: 500,
                            },
                        }),
                    ],
                }),
            );
        }

        if (evidence.issues![0].pageType === PageTypeEnum.REDMINE) {
            const url: string = `${this.REDMINE_URL}/projects/${evidence.project.toLowerCase()}/activity?from=${request.year}-${request.month}-${MONTHS(request.year)[request.month - 1].days}&user_id=${request.redmine_id}`;

            const page = await browser.newPage();
            await page.setViewport({ width: 1600, height: 1400 });

            await page.goto(url, { waitUntil: 'load' });

            const element = await page.waitForSelector(`div`);

            const screenshotArray: Uint8Array = await element?.screenshot()!;
            const screenshotBuffer: Buffer = Buffer.from(screenshotArray);

            await page.close();

            paragraphs.push(
                new Paragraph({
                    style: 'height: 100%',
                    children: [
                        new TextRun({
                            text: `Evidencia de la Actividad de ${evidence.userDisplayName} en Redmine del mes de ${evidence.month}`,
                            bold: true,
                            size: 20,
                            font: this.FONT,
                        }),
                        new ImageRun({
                            type: 'jpg',
                            data: screenshotBuffer,
                            transformation: {
                                width: 600,
                                height: 500,
                            },
                        }),
                    ],
                }),
            );
        }

        await browser.close();
        log.info(' Finish UserIssueService@getEvidenceImages method');
        return paragraphs;
    }
}
