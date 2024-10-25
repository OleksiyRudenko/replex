const roles = ["annotator", "validator", "verificator"]
export const db_schemaData = {
  databaseName: "data-delivery-roadmap",
  types: {
    // defaults per field name
    name: "VARCHAR(100) NOT NULL",
    short_name: "VARCHAR(25) NOT NULL",
    description: "VARCHAR(200) NOT NULL",
    // shorthands
    ISO_DATE: "DATE NOT NULL DEFAULT '1970-01-01'",
    BOOL: "BOOLEAN DEFAULT FALSE",
    // partial definitions
    PK: "AUTO_INCREMENT",
    PK_INT: "INT NOT NULL",
    PK_VC20: "VARCHAR(20) NOT NULL",
    FK: "ON UPDATE CASCADE ON DELETE RESTRICT",
  },
  tables: {
    op_theme: {
      op_theme_id: "*PK_INT",
      name: "*",
    },
    op_program: {
      op_program_id: "*PK_INT",
      op_theme_id: ["*FK", "op_theme"],
      name: "*",
      short_name: "*",
      description: "*",
    },
    device: {
      device_id: "*PK_INT",
      codename: "*name",
    },
    data_program: {
      data_program_id: "*PK_INT",
      op_program_id: ["*FK", "op_program"],
      name: "*",
      short_name: "*",
      description: "*",
    },
    data_program__device: {
      data_program_id: ["*FK", "data_program"],
      device_id: ["*FK", "device"],
    },
    data_track: {
      data_track_id: "*PK_INT",
      data_program_id: ["*FK", "data_program"],
      ml_purpose: ["ENUM", ["POC", "train+test", "eval"]],
      device_phase: ["ENUM", [""]],
      data_bundle_types: ["SET", ["ding", "sirena", "dump", "discarded_event", "ding+discard", ],],
      start_date: "*ISO_DATE",
      due_date: "*ISO_DATE",
      status: ["ENUM", ["planned", "postponed", "in progress", "cancelled", "done"]],
    },
    data_track__secondary_op_program: {
      data_track_id: ["*FK", "data_track"],
      op_program_id: ["*FK", "op_program"],
    },
    bundle_type: {
      bundle_type_id: "*PK_INT",
      name: "*",
    },
    markup_type: {
      markup_type_id: "*PK_VC20",
      name: "*",
    },
    markup_type__bundle_type: {
      markup_type_id: ["*FK", "markup_type"],
      bundle_type_id: ["*FK", "bundle_type"],
      is_compatible: "*BOOL",
    },
    team: {
      team_id: "*PK_INT",
      headcount: "INT",
      is_machine: "*BOOL",
    },
    team__markup_type: {
      team_id: ["*FK", "team"],
      markup_type_id: ["*FK", "markup_type"],
      skills: ["SET", roles],
    },
    data_subtrack: {
      data_subtrack_id: "*PK_INT",
      data_track_id: ["*FK", "data_track"],
      name: "*",
      markup_type_id: ["*FK", "markup_type"],
      annotation_team_id: ["*FK", "team", "team_id"],
      validation_team_id: ["*FK", "team", "team_id"],
      verification_team_id: ["*FK", "team", "team_id"],
    },
    annotation_productivity: {
      team_id: ["*FK", "team"],
      markup_type_id: ["*FK", "markup_type"],
      role: ["ENUM", roles],
      annotation_productivity_bundles_per_hour_per_head: "DECIMAL(6,2)",
    },
  },
}
