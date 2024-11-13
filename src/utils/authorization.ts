export function getCredentialsFromBasicAuth(authorization: string): string[] {
    const base64Credentials = authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    return credentials.split(':');
}
