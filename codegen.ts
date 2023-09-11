import fs from 'fs/promises'
import path from 'path'
import { CodegenConfig } from '@graphql-codegen/cli'
import {
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLUnionType,
} from 'graphql'
import { CodegenPlugin } from '@graphql-codegen/plugin-helpers'
import { spawnSync } from 'child_process'

const config: CodegenConfig = {
  schema: './src-tauri/schema.graphql',

  generates: {
    './src-tauri/src/graphql/generated.rs': {
      plugins: ['async-graphql'],
    },
    './src/graphql.d.ts': {
      plugins: ['typescript', 'typescript-operations'],
    },
    'graphql-schema.json': {
      plugins: ['introspection'],
    },
  },

  pluginLoader: async (name) => {
    if (name === '@graphql-codegen/async-graphql') {
      return asyncGraphqlPlugin
    }

    return require(name)
  },
}

export default config

interface AsyncGraphqlPluginOptions {
  dataSource?: string
}

const asyncGraphqlPlugin: CodegenPlugin<AsyncGraphqlPluginOptions> = {
  plugin: async (schema, _documents, config, _info) => {
    const codegenContext = {
      hasComplexObjects: false,
      hasEnums: false,
      hasInputObjects: false,
      hasSimpleObjects: false,
    }

    const dataSource = config.dataSource || 'use crate::datasource::DataSource;'

    const typeMap = schema.getTypeMap()
    const enumTypes: GraphQLEnumType[] = []
    const inputTypes: GraphQLInputObjectType[] = []
    const objectTypes: GraphQLObjectType[] = []
    const dataSourceFields: [string, GraphQLField<any, any, any>][] = []

    // TODO Guess we can check if these are actually used in the schema?
    let content = ''

    for (const typeName in typeMap) {
      if (
        typeName.startsWith('_') ||
        typeName === 'Query' ||
        typeName === 'Mutation' ||
        typeName === 'Subscription'
      ) {
        continue
      }

      const type = typeMap[typeName]
      if (type instanceof GraphQLEnumType) {
        enumTypes.push(type)
      }

      if (type instanceof GraphQLInputObjectType) {
        inputTypes.push(type)
      }

      if (type instanceof GraphQLObjectType) {
        objectTypes.push(type)
      }
    }

    codegenContext.hasEnums = enumTypes.length > 0
    codegenContext.hasInputObjects = inputTypes.length > 0

    for (const enumType of enumTypes) {
      content += `
#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug)]
pub enum ${enumType.name} {
  ${enumType
    .getValues()
    .map((x) => {
      return `
    #[graphql(name="${x.value}")]
    ${x.value},
    `
    })
    .join('\n\n')}
}
      `
    }

    for (const inputType of inputTypes) {
      content += `
#[derive(InputObject)]
pub struct ${inputType.name} {
  ${Object.values(inputType.getFields())
    .map((x) => {
      // TODO Check if it's recursed and use `Box<T>`.
      return `
      #[graphql(name="${x.name}")]
      pub ${x.name}: ${graphqlTypeToRustType(x.type)},
      `
    })
    .join('\n\n')}
}
      `
    }

    for (const objectType of objectTypes) {
      const simpleFields: GraphQLField<any, any, any>[] = []
      const complexFields: GraphQLField<any, any, any>[] = []

      for (const objectField of Object.values(objectType.getFields())) {
        if (
          objectField.type instanceof GraphQLUnionType ||
          objectField.type instanceof GraphQLInterfaceType
        ) {
          continue
        }

        const reducedFieldType = reduceGraphqlType(objectField.type)

        if (
          reducedFieldType instanceof GraphQLScalarType ||
          reducedFieldType instanceof GraphQLEnumType
        ) {
          codegenContext.hasSimpleObjects = true

          simpleFields.push(objectField)
        } else {
          codegenContext.hasComplexObjects = true

          complexFields.push(objectField)
        }
      }

      content += `
#[derive(SimpleObject, Debug, Clone)]
#[graphql(complex)]
pub struct ${objectType.name} {
  ${simpleFields
    .map((x) => {
      // TODO Check if it's recursed and use `Box<T>`.
      return `
      #[graphql(name="${x.name}")]
      pub ${x.name}: ${graphqlTypeToRustType(x.type)},
      `
    })
    .join('\n\n')}
}

#[ComplexObject]
impl ${objectType.name} {
  ${complexFields
    .map((x) => {
      dataSourceFields.push([objectType.name, x])
      return graphqlFieldResolverToRustFn(x, objectType.name)
    })
    .join('\n\n')}
}
      `
    }

    const query = schema.getQueryType()
    if (query) {
      codegenContext.hasComplexObjects = true

      content += `
pub struct ${query.name};

#[Object]
impl ${query.name} {
  ${Object.values(query.getFields())
    .map((x) => {
      if (
        x.type instanceof GraphQLUnionType ||
        x.type instanceof GraphQLInterfaceType
      ) {
        return
      }

      dataSourceFields.push([query.name, x])
      return graphqlFieldResolverToRustFn(x, query.name)
    })
    .join('\n\n')}
}
      `
    }

    const mutation = schema.getMutationType()
    if (mutation) {
      codegenContext.hasComplexObjects = true

      content += `
pub struct ${mutation.name};

#[Object]
impl ${mutation.name} {
  ${Object.values(mutation.getFields())
    .map((x) => {
      if (
        x.type instanceof GraphQLUnionType ||
        x.type instanceof GraphQLInterfaceType
      ) {
        return
      }

      dataSourceFields.push([mutation.name, x])
      return graphqlFieldResolverToRustFn(x, mutation.name)
    })
    .join('\n\n')}
}
      `
    }

    content =
      `
${codegenContext.hasComplexObjects ? 'use async_graphql::ComplexObject;' : ''}
${codegenContext.hasComplexObjects ? 'use async_graphql::Context;' : ''}
${codegenContext.hasEnums ? 'use async_graphql::Enum;' : ''}
${codegenContext.hasInputObjects ? 'use async_graphql::InputObject;' : ''}
${codegenContext.hasSimpleObjects ? 'use async_graphql::Object;' : ''}
${
  codegenContext.hasComplexObjects
    ? 'use async_graphql::Result as GraphQLResult;'
    : ''
}
${codegenContext.hasComplexObjects ? 'use async_graphql::SimpleObject;' : ''}

${codegenContext.hasComplexObjects ? dataSource : ''}
    ` + content

    let dataSourceTodo = `
use async_graphql::Result as GraphQLResult;

pub struct DataSource;

impl DataSource {
`

    for (const [baseName, field] of dataSourceFields) {
      const rustArgs = field.args.map(
        (x) => `_${x.name}: ${graphqlTypeToRustType(x.type)}`,
      )

      dataSourceTodo += `
pub async fn ${baseName}_${
        field.name
      }(&self, _root: &${baseName}, _ctx: &Context<'_>, ${rustArgs.join(
        ', ',
      )}) -> GraphQLResult<${graphqlTypeToRustType(field.type)}> {
        todo!()
}
  `
    }

    dataSourceTodo += '\n}'

    const outputFile = _info?.outputFile
    if (outputFile) {
      const tempFile = `${outputFile}.temp`
      await fs.writeFile(tempFile, content, 'utf-8')
      spawnSync('rustfmt', [tempFile])
      content = await fs.readFile(tempFile, 'utf-8')
      await fs.unlink(tempFile)

      const dataSourceImplPath = path.join(
        path.dirname(outputFile),
        'datasource_impl.rs',
      )
      await fs.writeFile(dataSourceImplPath, dataSourceTodo, 'utf-8')
      spawnSync('rustfmt', [dataSourceImplPath])
    }

    return {
      content,
    }
  },
}

function reduceGraphqlType(type: GraphQLInputType | GraphQLOutputType) {
  if (type instanceof GraphQLNonNull) {
    type = type.ofType
  }

  if (type instanceof GraphQLList) {
    type = reduceGraphqlType(type.ofType)
  }

  return type
}

function graphqlTypeToRustType(type: GraphQLInputType | GraphQLOutputType) {
  let isNullable = true
  let rustType: string = ''

  if (type instanceof GraphQLNonNull) {
    type = type.ofType
    isNullable = false
  }

  if (type instanceof GraphQLEnumType) {
    rustType = type.name
  } else if (type instanceof GraphQLScalarType) {
    if (type.name === 'ID') {
      rustType = 'String'
    }

    if (type.name === 'String') {
      rustType = 'String'
    }

    if (type.name === 'Boolean') {
      rustType = 'bool'
    }

    if (type.name === 'Int') {
      rustType = 'i32'
    }

    if (type.name === 'Float') {
      rustType = 'f32'
    }
  } else if (type instanceof GraphQLList) {
    rustType = `Vec<${graphqlTypeToRustType(type.ofType)}>`
  } else if (
    type instanceof GraphQLInputObjectType ||
    type instanceof GraphQLObjectType
  ) {
    rustType = type.name
  }

  if (isNullable) {
    return `Option<${rustType}>`
  }

  return rustType
}

function graphqlFieldResolverToRustFn(
  field: GraphQLField<any, any, any>,
  baseName: string,
) {
  const rustArgs = field.args.map(
    (x) =>
      `#[graphql(name="${x.name}")] ${x.name}: ${graphqlTypeToRustType(
        x.type,
      )}`,
  )
  const argNames = field.args.map((x) => x.name)

  return `
#[graphql(name="${field.name}")]
pub async fn ${field.name}(&self, ctx: &Context<'_>, ${rustArgs.join(
    ', ',
  )}) -> GraphQLResult<${graphqlTypeToRustType(field.type)}> {
    ctx.data_unchecked::<DataSource>().${baseName}_${
    field.name
  }(self, ctx, ${argNames.join(', ')}).await
}
  `
}

// function graphqlInputFieldToRustType(field: GraphQLInputField) {
//   return graphqlTypeToRustType(field.type)
// }
