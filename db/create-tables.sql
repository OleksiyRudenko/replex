create database `data-delivery-roadmap`;

use `data-delivery-roadmap`;

drop table `op_theme`;
drop table `op_program`;
drop table `data_program`;
drop table `data_track`;
drop table `data_subtrack`;

drop table `data_bundle_type`;
drop table `markup_type`;
drop table `annotation_productivity`;

CREATE TABLE `op_theme` (
  op_theme_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100),
  PRIMARY KEY (op_theme_id)
);

create table `op_program` (
  op_program_id INT NOT NULL AUTO_INCREMENT,
  op_theme_id INT NOT NULL,
  name VARCHAR(100),
  short_name VARCHAR(25),
  description VARCHAR(200),
  PRIMARY KEY (op_program_id),
  CONSTRAINT fk_op_theme FOREIGN KEY (op_theme_id)
    REFERENCES op_theme(op_theme_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

create table `data_program` (
  data_program_id INT NOT NULL AUTO_INCREMENT,
  op_program_id INT NOT NULL,
  name VARCHAR(100),
  short_name VARCHAR(25),
  description VARCHAR(200),
  PRIMARY KEY (data_program_id),
  CONSTRAINT fk_op_program FOREIGN KEY (op_program_id)
    REFERENCES op_program(op_program_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

create table `data_track` (
  data_track_id INT NOT NULL AUTO_INCREMENT,
  data_program_id INT NOT NULL,
  name VARCHAR(100),
  short_name VARCHAR(25),
  description VARCHAR(200),
  ml_purpose
  device_phase
  data_bundle_type


  PRIMARY KEY (data_track_id),
  CONSTRAINT fk_data_program FOREIGN KEY (data_program_id)
    REFERENCES data_program(data_program_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

create table `team` (

    team_id
    headcount
    markup_types (...)
    functions (annotation, validarion, verification)

);

/*
  Distinguishing point: data handling method (manual, automated), markup_type, and teams on the task
*/
create table `data_subtrack` (
  data_subtrack_id INT NOT NULL AUTO_INCREMENT,
  data_track_id INT NOT NULL,
  name VARCHAR(100),
  short_name VARCHAR(25),
  description VARCHAR(200),
  markup_type
  preannotation_team_id,
  validation_team_id,
  verification_team_id,


  PRIMARY KEY (data_subtrack_id),
  CONSTRAINT fk_data_track FOREIGN KEY (data_track_id)
    REFERENCES data_track(data_track_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

create table `annotation_productivity` (
  team_id
  data_bundle_type
  markup_type
  annotation_productivity_bundles_per_hour_per_head
)
