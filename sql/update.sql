
ALTER TABLE
	pastCombat
ADD
	flagCaptured BOOLEAN NOT NULL DEFAULT FALSE
;

#initialize the server's flag
INSERT INTO badges (accountId, name) VALUES (1, "Capture The Flag"); #my account ID

#move the badge between accounts
#INSERT INTO badges
#	(id, accountId)
#VALUES
#	(?, ?)
#ON DUPLICATE KEY UPDATE
#	accountId = VALUES(accountId)
#;

