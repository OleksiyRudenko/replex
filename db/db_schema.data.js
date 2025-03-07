const roles = ["annotator", "validator", "verificator"]
const mlPurpose = ["bulk_planning", "POC", "train+test", "eval"]
const devicePhase = ["bulk_planning", "DVT", "EVT"]
const dataBundleTypes = ["bulk_planning", "TBD", "ding", "sirena", "dump", "discarded_event", "ding+discard", "sensoric_data"]
const dataTrackStatus = ["scoping", "planned", "postponed", "in progress", "cancelled", "done"]
const requestAccuracy = ["low", "medium", "high"]
export const db_schemaData = {
  databaseName: "data-delivery-roadmap",
  types: { // make types for SQL, noSQL, and human-readable outputs
    // defaults per field name
    name: "VARCHAR(100) NOT NULL",
    short_name: "VARCHAR(25) NOT NULL",
    description: "VARCHAR(200) NOT NULL",
    generic_key: "VARCHAR(100) NOT NULL DEFAULT ''",
    // shorthands
    ISO_DATE: "DATE NOT NULL DEFAULT '1970-01-01'",
    BOOL: "BOOLEAN DEFAULT FALSE",
    INT0: "INT NOT NULL DEFAULT 0",
    // partial definitions
    PK: "AUTO_INCREMENT",
    PK_INT: "INT NOT NULL",
    PK_VC20: "VARCHAR(20) NOT NULL",
    FK: "ON UPDATE CASCADE ON DELETE RESTRICT",
  },
  tables: {
    op_theme: {
      op_theme_id: "*PK_INT",
      order_key: "*INT0",
      human_readable_PK: "*generic_key",
      short_name: "*",
      name: "*",
    },
    op_program: {
      op_program_id: "*PK_INT",
      op_theme_id: ["*FK", "op_theme"],
      order_key: "*INT0",
      human_readable_PK: "*generic_key",
      human_readable_FK_op_theme: "*generic_key", // used to map entries when id PK is not yet known
      short_name: "*",
      name: "*",
      description: "*",
    },
    device: {
      device_id: "*PK_INT",
      order_key: "*INT0",
      short_name: "*",
      name: "*",
    },
    data_program: {
      data_program_id: "*PK_INT",
      op_program_id: ["*FK", "op_program"],
      order_key: "*INT0",
      short_name: "*",
      name: "*",
      description: "*",
    },
    data_program__device: { // or data_track__device?
      data_program_id: ["*FK", "data_program"],
      order_key: "*INT0",
      device_id: ["*FK", "device"],
      device_phase: ["ENUM", devicePhase],
    },
    data_track: {
      data_track_id: "*PK_INT",
      data_program_id: ["*FK", "data_program"],
      order_key: "*INT0",
      ml_purpose: ["ENUM", mlPurpose],
      data_bundle_types: ["SET", dataBundleTypes],
      start_date: "DATE",
      due_date: "DATE",
      status: ["ENUM", dataTrackStatus],
      request_accuracy: ["ENUM", requestAccuracy],
      signed_off_by: "*name",
    },
    data_track__secondary_op_program: {
      data_track_id: ["*FK", "data_track"],
      op_program_id: ["*FK", "op_program"],
    },
    bundle_type: {
      bundle_type_id: "*PK_INT",
      order_key: "*INT0",
      mappingKey: "*INT0",
      short_name: "*",
      name: "*",
    },
    markup_type: {
      markup_type_id: "*PK_VC20",
      order_key: "*INT0",
      short_name: "*",
      name: "*",
    },
    markup_type__bundle_type: {
      markup_type_id: ["*FK", "markup_type"],
      bundle_type_id: ["*FK", "bundle_type"],
      is_compatible: "*BOOL",
    },
    team: {
      team_id: "*PK_INT",
      order_key: "*INT0",
      short_name: "*",
      name: "*",
      headcount: "INT",
      is_machine: "*BOOL",
    },
    // pre-populated data ["annotator", "validator", "verificator"]
    data_role: {
      data_role_id: "*PK_INT",
      order_key: "*INT0",
      short_name: "*",
      name: "*",
    },
    team__markup_type__data_role: {
      team_id: ["*FK", "team"],
      markup_type_id: ["*FK", "markup_type"],
      data_role_id: ["*FK", "data_role"],
      productivity_bundles_per_hour_per_head: "DECIMAL(6,2)",
    },
    data_subtrack: {
      data_subtrack_id: "*PK_INT",
      data_track_id: ["*FK", "data_track"],
      order_key: "*INT0",
      short_name: "*",
      name: "*",
      criticality: "*",
      bundle_count: "INT NOT NULL",
      bundle_count_computation_principle: "VARCHAR(255) NOT NULL DEFAULT \"gut feeling/educated guess\"",
      markup_type_id: ["*FK", "markup_type"],
      annotation_team_id: ["*FK", "team", "team_id"],
      validation_team_id: ["*FK", "team", "team_id"],
      verification_team_id: ["*FK", "team", "team_id"],
    },
    data_subtrack_plan: {

    },
    data_subtrack_supply: {
      supplier: "**",
      input: "",
      output: "",
      from_phase: "...",
      phase: "data acquisition | pre-selection | scene annotation | filtering | bundle annotation | filtering | delivery",
      source: "...",
    },
    /*
    annotation_productivity: {
      team_id: ["*FK", "team"],
      markup_type_id: ["*FK", "markup_type"],
      data_role_id: ["*FK", "data_role"],
      annotation_productivity_bundles_per_hour_per_head: "DECIMAL(6,2)",
    },
    */
    dm_hc_allocation_per_program: {

    },
  },
}
