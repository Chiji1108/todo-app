DROP INDEX IF EXISTS `users_email_unique`;--> statement-breakpoint
ALTER TABLE todos ADD `userId` text NOT NULL;--> statement-breakpoint
ALTER TABLE users ADD `googleId` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_googleId_unique` ON `users` (`googleId`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `role`;