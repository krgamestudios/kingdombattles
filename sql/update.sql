#NOTE: ALWAYS, ALWAYS, ALWAYS write a script in revert.sql that undoes these changes

ALTER TABLE
	profiles
ADD COLUMN
	ladderRank INTEGER UNSIGNED
AFTER
	accountId
;

ALTER TABLE
	profiles
ADD COLUMN
	ladderRankWeight FLOAT UNSIGNED
AFTER
	ladderRank
;

