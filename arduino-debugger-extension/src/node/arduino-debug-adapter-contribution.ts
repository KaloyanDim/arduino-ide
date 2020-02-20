import * as path from 'path';
import { injectable, inject } from 'inversify';
import { DebugAdapterContribution, DebugAdapterExecutable } from '@theia/debug/lib/common/debug-model';
import { DebugConfiguration } from '@theia/debug/lib/common/debug-configuration';
import { IJSONSchema } from '@theia/core/lib/common/json-schema';
import { ArduinoCli } from 'arduino-ide-extension/lib/node/arduino-cli';

@injectable()
export class ArduinoDebugAdapterContribution implements DebugAdapterContribution {

    readonly type = 'arduino';
    readonly label = 'Arduino';
    readonly languages = ['c', 'cpp', 'ino'];

    @inject(ArduinoCli) arduinoCli: ArduinoCli;

    getSchemaAttributes(): IJSONSchema[] {
        return [
            {
                'properties': {
                    'sketch': {
                        'type': 'string',
                        'description': 'path to the sketch root ino file',
                        'default': '${file}',
                    },
                    'runToMain': {
                        'description': 'If enabled the debugger will run until the start of the main function.',
                        'type': 'boolean',
                        'default': false
                    },
                    'verbose': {
                        'type': 'boolean',
                        'description': 'Produce verbose log output',
                        'default': false
                    },
                    'debugDebugAdapter': {
                        'type': 'boolean',
                        'description': 'Start the debug adapter in debug mode (with --inspect-brk)',
                        'default': false
                    },
                }
            }
        ]
    }

    provideDebugAdapterExecutable(config: DebugConfiguration): DebugAdapterExecutable {
        const debugAdapterMain = path.join(__dirname, 'debug-adapter', 'main');
        if (config.debugDebugAdapter) {
            return {
                command: process.execPath,
                args: ['--inspect-brk', debugAdapterMain],
            }
        }
        return {
            modulePath: debugAdapterMain,
            args: [],
        }
    }

    provideDebugConfigurations(): DebugConfiguration[] {
        return [
            <DebugConfiguration>{
                name: this.label,
                type: this.type,
                request: 'launch'
            }
        ];
    }

    async resolveDebugConfiguration(config: DebugConfiguration): Promise<DebugConfiguration> {
        const res: ActualDebugConfig = {
            ...config,
            arduinoCli: await this.arduinoCli.getExecPath(),
            fqbn: '${fqbn}',
            uploadPort: '${port}'
        }
        if (!res.sketch) {
            res.sketch = '${file}';
        }
        return res;
    }

}

interface ActualDebugConfig extends DebugConfiguration {
    arduinoCli?: string;
    sketch?: string;
    fqbn?: string;
    uploadPort?: string;
}
