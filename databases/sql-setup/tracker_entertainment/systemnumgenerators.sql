DROP GENERATOR SYSTEMENTITYNUM;
DROP GENERATOR SYSTEMGENRENUM;
DROP GENERATOR SYSTEMITEMNUM;
DROP GENERATOR SYSTEMPEOPLENUM;
DROP GENERATOR SYSTEMSERIESNUM;

CREATE SEQUENCE SYSTEMITEMNUM START WITH 1 INCREMENT BY 1;
GRANT USAGE ON SEQUENCE SYSTEMITEMNUM TO "PUBLIC";

CREATE SEQUENCE SYSTEMSERIESNUM START WITH 1 INCREMENT BY 1;
GRANT USAGE ON SEQUENCE SYSTEMSERIESNUM TO "PUBLIC";

CREATE SEQUENCE SYSTEMGENRENUM START WITH 1 INCREMENT BY 1;
GRANT USAGE ON SEQUENCE SYSTEMGENRENUM TO "PUBLIC";

CREATE SEQUENCE SYSTEMENTITYNUM START WITH 1 INCREMENT BY 1;
GRANT USAGE ON SEQUENCE SYSTEMENTITYNUM TO "PUBLIC";

CREATE SEQUENCE SYSTEMPEOPLENUM START WITH 1 INCREMENT BY 1;
GRANT USAGE ON SEQUENCE SYSTEMPEOPLENUM TO "PUBLIC";