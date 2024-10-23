# Imatia Audit Evidences Maker
This is a project to consume jira cloud rest api and process data to build documents for evidences.

## Requirements

- Node v20.18.0
- Git 2.41.0.windows.3
- Postman v11.17.0

## Common setup

Clone the repo and install the dependencies.

> npm install

## Steps for read-only access

To start the express server, run the following

>   npm run start:dev

Open http://localhost:3000 and take a look around.

## Steps for read and write access (recommended)

- Step 1: Open .env file and inject your credentials so it looks like this

>   NODE_ENV=development
    PROTOCOL_URL=http://
    BASE_URL=localhost:
    PORT=3000
    CI=1
    MONGODB_CONNECTION_STRING=mongodb://userExample:passwordExample@localhost:27017/
    MONGODB_DB_NAME="imatia-audit-evidences-maker-db"
    JIRA_CLOUD_URL=jiracloud-example.com 


- Step 2: To start the express server, run the following

> npm run start:dev

- Final Step:

Open http://localhost:3000 and take a look around.