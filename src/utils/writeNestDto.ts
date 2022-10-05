import { resolve } from 'path';

import type { Model } from '../client/interfaces/Model';
import type { HttpClient } from '../HttpClient';
import type { Indent } from '../Indent';
import { writeFile } from './fileSystem';
import { formatCode as f } from './formatCode';
import { formatIndentation as i } from './formatIndentation';
import type { Templates } from './registerHandlebarTemplates';

/**
 * Generate Nest DTO's, for class-transformer, using the Handlebar template and write to disk.
 * @param models Array of Models to write
 * @param templates The loaded handlebar templates
 * @param outputPath Directory to write the generated files to
 * @param httpClient The selected httpClient (fetch, xhr, node or axios)
 * @param useUnionTypes Use union types instead of enums
 * @param indent Indentation options (4, 2 or tab)
 */
export const writeClientNestDto = async (
    models: Model[],
    templates: Templates,
    outputPath: string,
    indent: Indent
): Promise<void> => {
    for (const model of models) {
        if (!['all-of', 'interface'].includes(model.export)) {
            continue
        }
        const file = resolve(outputPath, `${model.name}.dto.ts`);
        const templateResult = templates.exports.nestDto({
            ...model,
        });
        await writeFile(file, i(f(templateResult), indent));
    }
};
