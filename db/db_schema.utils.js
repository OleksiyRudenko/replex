/**
 * Converts table definitions object into array of table definition objects
 * @param {Object} tableDefinitions
 * @returns {{tableName: String, fields: Object, indices: [], constraints: [], }[]}
 */
const restructureTableDefinitions = tableDefinitions =>
  Object
    .entries(tableDefinitions)
    .map(([tableName, fieldDefinitions]) => ({
        tableName,
        fields: fieldDefinitions,
        indices: [],
        constraints: [],
      })
    )

/**
 * Expands shorthanded field definitions from tableDefinition into fields,
 * indices and constraints definitions.
 *
 * All tables definitions array is used to pick types for foreign keys.
 * @param {Object} tableDefinition - table definition object to expand
 * @param {Array} tableDefinitions - array of all table definitions for foreign key reference expansion
 * @param {Object} types - meta-type definitions
 * @returns {Object} tableDefinition, .fields = {filedName: String[] }
 */
const expandFieldDefinitions = (tableDefinition, tableDefinitions, types) => {
  const {tableName, fields, indices, constraints} = tableDefinition
  console.log("===>", tableName)
  tableDefinition = Object
    .entries(fields)
    .reduce((updatedTableDefinition, [fieldName, fieldDefinition]) => {
      if (!Array.isArray(fieldDefinition)) fieldDefinition = [fieldDefinition]
      let updatedFieldDefinition = []
      let updateFieldDefinition = true // used to handle index definitions
      // console.dir(fieldDefinition)
      const type = fieldDefinition.shift()
      if (type[0] === "*") {
        const metaType = type.split("*")[1]
        const metaTypePrefix = metaType.split("_")[0]
        switch (metaType) {
          case "":
            updatedFieldDefinition.push(types[fieldName])
            break
          case "FK":
            const foreignTableName = fieldDefinition[0]
            const foreignFieldName = fieldDefinition[1] ?? fieldName
            const foreignTableDefinition = tableDefinitions.find(tableDefinition => tableDefinition.tableName === foreignTableName)
            console.dir({AT: "FK Table from " + tableName, ...foreignTableDefinition, FIELDDEF: foreignTableDefinition.fields[foreignFieldName]})
            updatedFieldDefinition.push(foreignTableDefinition.fields[foreignFieldName][0]) // only essential type definition
            updatedTableDefinition.constraints.push(`fk_${fieldName} FOREIGN KEY (${fieldName}) REFERENCES ${foreignTableName}(${foreignFieldName}) ${types.FK}`)
            break
          default:
            if (metaTypePrefix === "PK") {
              updatedFieldDefinition.push(types[metaType])
              updatedFieldDefinition.push(types.PK)
              updatedTableDefinition.constraints.push(`pk_${fieldName} PRIMARY KEY (${fieldName})`)
            } else {
              updatedFieldDefinition.push(types[metaType])
            }
        }
      } else {
        switch (type) {
          case "ENUM":
          case "SET":
            updatedFieldDefinition.push(`${type}('${fieldDefinition[0].join("','")}')`)
            break
          default:
            updatedFieldDefinition = [type, ...fieldDefinition]
        }
      }
      if (updateFieldDefinition)
        updatedTableDefinition.fields[fieldName] = updatedFieldDefinition
      return updatedTableDefinition
    }, {
      tableName,
      fields: {},
      indices,
      constraints,
    })
  return tableDefinition
}

export const createTableSQLDefinitions = (tableDefinitions, fieldTypes) => {
  tableDefinitions = restructureTableDefinitions(tableDefinitions)
  const definitionsCount = tableDefinitions.length
  console.dir(tableDefinitions.map(tableDefinition => tableDefinition.tableName))
  for (let i = 0; i < definitionsCount; i++) {
    const tableDefinition = tableDefinitions.shift()
    tableDefinitions.push(expandFieldDefinitions(tableDefinition, tableDefinitions, fieldTypes))
  }

  return tableDefinitions
    .map(({tableName, fields, indices, constraints}) =>
        `CREATE TABLE ${tableName} (\n` +
        [
          ...Object.entries(fields)
            .map(([fieldName, fieldDefinition]) =>
              `  ${fieldName} ${fieldDefinition.join(" ")}`
            ),
          // ...indices.map(index => `  INDEX ${index}`),
          ...constraints.map(constraint => `  CONSTRAINT ${constraint}`),
        ].join(",\n") + "\n);\n"
      ).join("\n")
}
