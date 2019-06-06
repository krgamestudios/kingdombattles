#NOTE: ALWAYS, ALWAYS, ALWAYS write a script in revert.sql that undoes these changes

ALTER TABLE diagnostics ADD COLUMN activity INTEGER DEFAULT NULL;