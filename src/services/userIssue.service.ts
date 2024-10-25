import axios from 'axios';
import { Document, ExternalHyperlink, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
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

const log = getLogger('UserIssueService.service');

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

    private readonly JIRA_CLOUD_URL = process.env.JIRA_CLOUD_URL!;

    private readonly FONT = 'Segoe UI';

    private axiosInstance = axios.create({
        baseURL: this.JIRA_CLOUD_URL,
        timeout: 5000,
    });

    /**
     * Returns the user issues as schema
     * @param {IUserIssuesInput} request - request body with username, startDate and endDate
     * @returns {Promise<IDataIssue>} Async user issues as schema
     */
    public async getUserIssues(request: IUserIssuesInput): Promise<IDataIssue> {
        log.info('Start UserIssueService@getUserIssues method with username: ', request.username);

        const startDate: string = `${request.year}-${request.month}-01`;
        const endDate: string = `${request.year}-${request.month}-${MONTHS(request.year)[request.month - 1].days}`;

        log.info(' UserIssueService@getUserIssues date filters: ', { startDate, endDate });

        const promiseAxios = this.axiosInstance.get('/rest/api/2/search', {
            params: {
                jql: `assignee in (${request.username}) AND updated >= ${startDate} AND updated <= ${endDate}`,
            },
            headers: {
                Authorization: request.authorization,
            },
        });

        let data: Record<string, any> = {};

        try {
            const response = await promiseAxios;
            data = response.data;
        } catch (error: any) {
            log.error(error.response.data.errorMessages);
        }

        const userIssue: IDataIssue = {
            month: MONTHS()[request.month - 1].displayName,
            startAt: data.startAt,
            maxResults: data.maxResults,
            total: data.total,
            userDisplayName: '',
            project: '',
            issues: data.issues.map((issue: Record<string, any>) => ({
                id: issue.id,
                key: issue.key,
                self: this.JIRA_CLOUD_URL + '/browse/' + issue.key,
                type: issue.fields.issuetype.name,
                created: issue.fields.created,
                updated: issue.fields.updated,
                assignee: issue.fields.assignee.displayName,
                status: issue.fields.status.name,
                description: issue.fields.description,
                summary: issue.fields.summary,
                project: issue.fields.project.name,
                projectTypeKey: issue.fields.project.projectTypeKey
            })),
        };

        userIssue.issues = userIssue.issues;
        userIssue.userDisplayName = userIssue.issues[0]?.assignee;
        userIssue.project = userIssue.issues[0]?.project;

        log.info('Finish UserIssueService@getUserIssues method');
        return userIssue;
    }

    /**
     * Maps the User Issues to create Evidence Description for the document
     * @param {IUserIssuesInput[]} request - the same request to get user issues
     * @returns {Promise<IEvidence>} Async promise to get Evidence description for the Word Template
     */
    public async getUserIssuesDescriptions(request: IUserIssuesInput): Promise<IEvidence> {
        log.info('Start UserIssueService@getUserIssuesDescriptions with username: ', request.username);
        const userIssue: IDataIssue = await this.getUserIssues(request);

        const evidenceStart: string = `En el mes de ${userIssue.month} de ${request.year} se realizaron las siguientes tareas por ${userIssue.userDisplayName}: `;

        const issuesDescription: IIssueDescription[] = [];

        userIssue.issues.forEach((issue: IUserIssue) => {
            const title: string = `${issue.type} ${issue.key}: `;
            const summary: string = `${issue.summary} del proyecto ${issue.project}. Se trataba de ${issue.description} Esta tarea fue creada el día ${formatDateTime(issue.created).date} a las ${formatDateTime(issue.created).time} y su ultima actualización fue el día ${formatDateTime(issue.updated).date} a las ${formatDateTime(issue.updated).time} con status ${issue.status}. En el siguiente enlace se puede consultar más a detalle esta tarea: `;
            const link: string = issue.self;

            issuesDescription.push({ title, summary, link });
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
    public async createTemplate(request: IUserIssuesInput): Promise<IEvidence> {
        log.info('Start UserIssueService@createTemplate with username: ', request.username);

        const evidence: IEvidence = await this.getUserIssuesDescriptions(request);

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

        const response: IEvidence = {
            ...evidence,
            issues: undefined,
            path: newFileName,
        };

        if (fs.existsSync(newFileName)) {
            return response; // fs.rmSync(newFileName);
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
                                            text: 'Proyecto: ',
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
                                            text: 'Nombre: ',
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
                new TableRow({
                    children: [
                        new TableCell({
                            children: await this.getEvidenceImages(evidence.issues!, request.authorization),
                        }),
                    ],
                }),
            ],
        });

        const doc = new Document({
            sections: [
                {
                    children: [table1, new Paragraph(''), table2, new Paragraph(''), table3, new Paragraph(''), table4, new Paragraph(''), table5, new Paragraph(''), table6],
                },
            ],
        });

        const newBuffer = await Packer.toBuffer(doc);
        fs.writeFileSync(newFileName, newBuffer);
        log.info('Finish UserIssueService@createTemplate: ', newFileName);

        return response;
    }

    /**
     * Creates Evidence Template Doc of the year
     * @param {IUserIssuesInput[]} request - the request to get user issues
     * @returns {Promise<IEvidence>} Async promise to get Evidence description for the Word Template
     */
    public async createTemplatesYear(request: IUserIssuesInput): Promise<any> {
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
                    date: `${MONTHS(request.year)[request.month - 1].displayName} de ${request.year}`,
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

    /**
     * Goes to Jira Cloud url, makes login, and takes an screenshot of the issue
     * @param {string} url - Jira Cloud url
     * @param {Browser} browser - Browser instance
     * @param {boolean} isLogin - indicates if its the first time going to take screenshot, it needs login first
     * @param {string} authorization - authorization token to make login
     * @returns {Promise<Buffer>} returns the image buffer to be copied into the template
     */
    private async takeScreenshot(url: string, browser: Browser, isLogin: boolean, authorization: string): Promise<Buffer> {
        log.info(' Start UserIssueService@getIssues takeScreenshot with url: ', url);
        const page = await browser.newPage();

        await page.setViewport({ width: 1200, height: 1000 });

        await page.goto(url, { waitUntil: 'load' });

        if (isLogin) {
            const base64Credentials = authorization.split(' ')[1];

            const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');

            const [username, password] = credentials.split(':');

            await page.type('input[id="login-form-username"]', username);

            await page.type('input[id="login-form-password"]', password);

            await page.focus('input[id=login-form-submit]');

            await page.click('input[id=login-form-submit]');

            await page.waitForNavigation();
        }

        await page.evaluate(() => {
            window.scrollTo(0, 0);
            window.addEventListener('scroll', () => {
                window.scrollTo(0, 0);
            });
        });

        const screenshotArray = await page.screenshot();
        const screenshotBuffer = Buffer.from(screenshotArray);

        page.close();
        log.info(' Finish UserIssueService@getIssues takeScreenshot');
        return screenshotBuffer;
    }

    /**
     * Maps the User Issues Description to get Evidence Images for the Document Template
     * @param {IIssueDescription[]} issues - issue data array
     * @param {string} authorization - authorization token to make login
     * @returns {Promise<Buffer>} returns the image buffer to be copied into the template
     */
    private async getEvidenceImages(issues: IIssueDescription[], authorization: string): Promise<any> {
        log.info(' Start UserIssueService@getEvidenceImages method');
        const browser: Browser = await puppeteer.launch();

        const paragraphs: Paragraph[] = [];

        for (let index = 0; index < issues.length; index++) {
            const imageBase64Data = await this.takeScreenshot(issues[index].link, browser, index === 0, authorization);

            paragraphs.push(
                new Paragraph({
                    style: 'height: 100%',
                    children: [
                        new TextRun({
                            text: issues[index].title,
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

        await browser.close();
        log.info(' Finish UserIssueService@getEvidenceImages method');
        return paragraphs;
    }
}
