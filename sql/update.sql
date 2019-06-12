#NOTE: ALWAYS, ALWAYS, ALWAYS write a script in revert.sql that undoes these changes

ALTER TABLE
	pastSpying
MODIFY COLUMN
	success ENUM ('success', 'failure', 'ineffective')
;

UPDATE
	pastSpying
SET
	success = 'ineffective'
WHERE
	success = 'success'
AND
	spoilsGold = 0
AND
	(SELECT COUNT(*) FROM equipmentStolen WHERE pastSpyingId = pastSpying.id) = 0
;

