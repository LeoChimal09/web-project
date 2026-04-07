CREATE TABLE `orders` (
	`ref` varchar(32) NOT NULL,
	`placed_at` varchar(40) NOT NULL,
	`status` enum('pending','in_progress','ready','completed','cancelled') NOT NULL,
	`eta_minutes` tinyint unsigned DEFAULT null,
	`form_json` text NOT NULL,
	`order_entries_json` text NOT NULL,
	`total_price` double NOT NULL,
	CONSTRAINT `orders_ref` PRIMARY KEY(`ref`)
);
