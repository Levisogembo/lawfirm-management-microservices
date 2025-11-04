-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 03, 2025 at 02:41 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lawfirm_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `appointmentId` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `startTime` datetime NOT NULL,
  `endTime` datetime NOT NULL,
  `notes` text DEFAULT NULL,
  `location` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `clientId` varchar(36) DEFAULT NULL,
  `caseId` varchar(36) DEFAULT NULL,
  `assignedTo` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cases`
--

CREATE TABLE `cases` (
  `caseID` varchar(36) NOT NULL,
  `caseTitle` varchar(255) NOT NULL,
  `caseNumber` varchar(255) NOT NULL,
  `caseType` varchar(255) NOT NULL,
  `caseStatus` varchar(255) NOT NULL,
  `filedDate` datetime NOT NULL,
  `hearingDate` datetime DEFAULT NULL,
  `assignedJudge` varchar(255) NOT NULL,
  `plaintiffs` varchar(255) DEFAULT NULL,
  `defendants` varchar(255) DEFAULT NULL,
  `caseNotes` text DEFAULT NULL,
  `assignedBy` varchar(255) DEFAULT NULL,
  `clientId` varchar(36) DEFAULT NULL,
  `assignedTo` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `client`
--

CREATE TABLE `client` (
  `clientId` varchar(36) NOT NULL,
  `clientName` varchar(255) NOT NULL,
  `phoneNumber` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `files`
--

CREATE TABLE `files` (
  `fileId` varchar(36) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `uploadedAt` datetime NOT NULL,
  `uploadedBy` varchar(255) NOT NULL,
  `fileType` varchar(255) NOT NULL,
  `mimeType` varchar(255) NOT NULL,
  `fileSize` varchar(255) NOT NULL,
  `filepath` varchar(255) DEFAULT NULL,
  `s3FileUrl` varchar(255) DEFAULT NULL,
  `s3Key` varchar(255) DEFAULT NULL,
  `caseId` varchar(36) DEFAULT NULL,
  `clientId` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` varchar(36) NOT NULL,
  `role` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role`) VALUES
('add70d33-e20e-4c41-b533-4a5667ebb6c6', 'Admin');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `taskId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Not Started',
  `notes` text DEFAULT NULL,
  `priority` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `completedAt` datetime DEFAULT NULL,
  `assignedBy` varchar(255) DEFAULT NULL,
  `assigned_to` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `fullname` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phonenumber` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `isVerified` tinyint(4) NOT NULL DEFAULT 0,
  `roleId` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `username`, `fullname`, `password`, `phonenumber`, `createdAt`, `isVerified`, `roleId`) VALUES
('3c7745f1-511c-4a3c-a8f6-fc900cad08e2', 'ogembolevis97@gmail.com', 'Levis', 'Levis Ogembo', '$2b$10$ccJ0t7nKsAsoeR2qWAmBnO6HjmgcMSY/lP4c3HaLbWz3Jntgun/Am', '0716527214', '2025-10-22 17:44:56', 1, 'add70d33-e20e-4c41-b533-4a5667ebb6c6');

-- --------------------------------------------------------

--
-- Table structure for table `visitors`
--

CREATE TABLE `visitors` (
  `visitorId` varchar(36) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `phoneNumber` varchar(255) NOT NULL,
  `purposeOfVisit` varchar(255) NOT NULL,
  `whoToSee` varchar(255) DEFAULT NULL,
  `timeIn` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointmentId`),
  ADD KEY `FK_c4dbd8eb292b83b5dc67be3cf45` (`clientId`),
  ADD KEY `FK_2736e5b12427c92454073cf8d27` (`caseId`),
  ADD KEY `FK_09685eb55aa9f481c0cd4723131` (`assignedTo`);

--
-- Indexes for table `cases`
--
ALTER TABLE `cases`
  ADD PRIMARY KEY (`caseID`),
  ADD UNIQUE KEY `IDX_2064054503f00114ee9375a8cf` (`caseNumber`),
  ADD KEY `FK_fbf8265e90624733f68ff5333ad` (`clientId`),
  ADD KEY `FK_0cc6785058aa22a5704fe85d2b8` (`assignedTo`);

--
-- Indexes for table `client`
--
ALTER TABLE `client`
  ADD PRIMARY KEY (`clientId`),
  ADD UNIQUE KEY `IDX_6436cc6b79593760b9ef921ef1` (`email`);

--
-- Indexes for table `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`fileId`),
  ADD UNIQUE KEY `IDX_ea1da54d986115b89c88939788` (`fileName`),
  ADD KEY `FK_08b79c74ac0614f52b5053802fb` (`caseId`),
  ADD KEY `FK_63a9da42666b576b5ea6d53023b` (`clientId`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_ccc7c1489f3a6b3c9b47d4537c` (`role`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`taskId`),
  ADD UNIQUE KEY `IDX_396d500ff7f1b82771ddd812fd` (`name`),
  ADD KEY `FK_5770b28d72ca90c43b1381bf787` (`assigned_to`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  ADD UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`),
  ADD KEY `FK_368e146b785b574f42ae9e53d5e` (`roleId`);

--
-- Indexes for table `visitors`
--
ALTER TABLE `visitors`
  ADD PRIMARY KEY (`visitorId`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `FK_09685eb55aa9f481c0cd4723131` FOREIGN KEY (`assignedTo`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_2736e5b12427c92454073cf8d27` FOREIGN KEY (`caseId`) REFERENCES `cases` (`caseID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_c4dbd8eb292b83b5dc67be3cf45` FOREIGN KEY (`clientId`) REFERENCES `client` (`clientId`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `cases`
--
ALTER TABLE `cases`
  ADD CONSTRAINT `FK_0cc6785058aa22a5704fe85d2b8` FOREIGN KEY (`assignedTo`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_fbf8265e90624733f68ff5333ad` FOREIGN KEY (`clientId`) REFERENCES `client` (`clientId`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `files`
--
ALTER TABLE `files`
  ADD CONSTRAINT `FK_08b79c74ac0614f52b5053802fb` FOREIGN KEY (`caseId`) REFERENCES `cases` (`caseID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_63a9da42666b576b5ea6d53023b` FOREIGN KEY (`clientId`) REFERENCES `client` (`clientId`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `FK_5770b28d72ca90c43b1381bf787` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `FK_368e146b785b574f42ae9e53d5e` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
