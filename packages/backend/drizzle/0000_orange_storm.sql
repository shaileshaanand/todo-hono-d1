CREATE TABLE `todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`title` text NOT NULL,
	`deadline` integer,
	`deleted` integer DEFAULT false NOT NULL,
	`updatedAt` integer NOT NULL,
	`createdAt` integer NOT NULL
);
