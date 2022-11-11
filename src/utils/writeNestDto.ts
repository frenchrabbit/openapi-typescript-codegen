import { resolve } from 'path';

import type { Model } from '../client/interfaces/Model';
import type { HttpClient } from '../HttpClient';
import type { Indent } from '../Indent';
import { writeFile } from './fileSystem';
import { formatCode as f } from './formatCode';
import { formatIndentation as i } from './formatIndentation';
import type { Templates } from './registerHandlebarTemplates';

const dtoName = (name: string): string => `${name}Nest`;

const dtoType = (el: Model): Model => {
    const isGeneric = el.export === 'generic' || (el.export === 'array' && el.imports.length === 0);
    const isEnum = el.export === 'enum';
    return {
        ...el,
        ...(isGeneric || isEnum
            ? {}
            : {
                  type: dtoName(el.type),
                  base: dtoName(el.base),
              }),
    };
};

const dtoNameProperties = (properties: Model[]): Model[] =>
    properties.map(el => {
        return {
            ...dtoType(el),
            properties: dtoNameProperties(el.properties),
        };
    });

/**
 * Generate Nest DTO's, for class-transformer, using the Handlebar template and write to disk.
 * @param models Array of Models to write
 * @param templates The loaded handlebar templates
 * @param outputPath Directory to write the generated files to
 * @param httpClient The selected httpClient (fetch, xhr, node or axios)
 * @param useUnionTypes Use union types instead of enums
 * @param indent Indentation options (4, 2 or tab)
 */
export const writeNestDto = async (
    models: Model[],
    templates: Templates,
    outputPath: string,
    indent: Indent
): Promise<void> => {
    for (const model of models) {
        const name = dtoName(model.name);

        const file = resolve(outputPath, `${name}.ts`);
        if (['MongoObjectId'].includes(model.name)) {
            await writeFile(
                file,
                `
          import { Types } from 'mongoose'
          export type ${name} = Types.ObjectId;
          `
            );
            continue;
        }
        if (['DateISO'].includes(model.name)) {
            await writeFile(
                file,
                `
          export type ${name} = Date;
          `
            );
            continue;
        }

        const templateResult = templates.exports.nestDto({
            ...dtoType(model),
            name,
            httpClient: 'node',
            imports: model.imports.map(dtoName),
            properties: dtoNameProperties(model.properties),
        });

        await writeFile(file, i(f(templateResult), indent));
    }
};
