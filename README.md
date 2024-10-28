# Imatia Audit Evidences Maker
This is a project to consume jira cloud rest api and process data to build documents for evidences.

## Requirements

- Node v20.18.0
- Git 2.41.0.windows.3
- Postman v11.17.0

## Common setup

Clone the repo and install the dependencies.

> npm install

Create the .env file on the root of the project and inject your credentials so it looks like this, check the .env.example file to see credentials

>   NODE_ENV=development
    PROTOCOL_URL=http://
    BASE_URL=localhost:
    PORT=3000
    JIRA_CLOUD_URL=jiracloud-example.com 

## Steps for read-only access

To start the express server, run the following

>   npm run start:dev

Open http://localhost:3000/docs and take a look around the Swagger UI.

## Steps for read and write access (recommended)

- Step 1: To start the express server, run the following

> npm run start:dev

- Final Step:

Open http://localhost:3000 and take a look around with postman app.