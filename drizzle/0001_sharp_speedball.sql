CREATE TABLE `customer_email_verification_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`token_hash` varchar(128) NOT NULL,
	`name` varchar(255),
	`expires_at` varchar(40) NOT NULL,
	`created_at` varchar(40) NOT NULL,
	CONSTRAINT `customer_email_verification_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_email_verification_tokens_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` varchar(40) NOT NULL,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `eta_minutes` tinyint unsigned;--> statement-breakpoint
ALTER TABLE `orders` ADD `customer_email` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_provider` varchar(32);--> statement-breakpoint
ALTER TABLE `orders` ADD `stripe_checkout_session_id` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `stripe_payment_intent_id` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_currency` varchar(8);--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_amount_cents` int unsigned;--> statement-breakpoint
ALTER TABLE `orders` ADD `paid_at` varchar(40);--> statement-breakpoint
ALTER TABLE `orders` ADD `cancellation_note` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancelled_by` enum('admin','customer');--> statement-breakpoint
ALTER TABLE `orders` ADD `notification_dismissed_at` varchar(40);