/* need to change the following to smallint. may need to create new column, transfer data, then drop old column? */
ALTER TABLE USERLIST ALTER COLUMN ISPRIVATE TYPE SMALLINT;
ALTER TABLE GENRE ALTER COLUMN ISENTERTAINMENT TYPE SMALLINT;
ALTER TABLE GENRE ALTER COLUMN ISBOOK TYPE SMALLINT;

/* also need to review triggers and ensure all fields are getting initialized properly. */
