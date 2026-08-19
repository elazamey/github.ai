CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`gateIndex` int NOT NULL,
	`sha` varchar(128) NOT NULL,
	`branch` varchar(120) NOT NULL,
	`workflowRunUrl` varchar(512),
	`workflowRunId` varchar(128),
	`checks` json NOT NULL,
	`decision` enum('PASS','BLOCK','TODO') NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`gateIndex` int NOT NULL,
	`baseline` varchar(128),
	`sha` varchar(128),
	`status` enum('PASS','BLOCK','TODO') NOT NULL DEFAULT 'TODO',
	`requirements` json NOT NULL,
	`checks` json NOT NULL,
	`reasons` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`repository` varchar(256) NOT NULL,
	`defaultBranch` varchar(120) NOT NULL,
	`baseline` varchar(128),
	`verificationCommands` json NOT NULL,
	`currentGate` int NOT NULL DEFAULT 0,
	`status` enum('PASS','BLOCK','TODO') NOT NULL DEFAULT 'TODO',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_repository_unique` UNIQUE(`repository`)
);
--> statement-breakpoint
CREATE TABLE `roadmapPhases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(220) NOT NULL,
	`priority` enum('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
	`status` enum('PASS','BLOCK','TODO') NOT NULL DEFAULT 'TODO',
	`description` text NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roadmapPhases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technicalDecisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`gateIndex` int,
	`sha` varchar(128),
	`title` varchar(220) NOT NULL,
	`context` text NOT NULL,
	`decision` text NOT NULL,
	`status` enum('PROPOSED','ACCEPTED','SUPERSEDED') NOT NULL DEFAULT 'PROPOSED',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `technicalDecisions_id` PRIMARY KEY(`id`)
);
