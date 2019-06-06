#NOTE: ALWAYS, ALWAYS, ALWAYS write a script in revert.sql that undoes these changes

ALTER TABLE accounts ADD COLUMN lastActivityTime TIMESTAMP DEFAULT '2019-01-01 00:00:00';