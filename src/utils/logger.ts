import { LogLevel } from 'typescript-logging';
import { Log4TSProvider, Logger } from 'typescript-logging-log4ts-style';

const provider = Log4TSProvider.createProvider('LoggerProvider', {
    /* Specify the various group expressions to match against */
    groups: [
        {
            expression: new RegExp('.+'),
            level: LogLevel.Info,
        },
        {
            expression: new RegExp('@+'),
            level: LogLevel.Debug,
        },
    ],
});

export default function getLogger(name: string): Logger {
    return provider.getLogger(name);
}
