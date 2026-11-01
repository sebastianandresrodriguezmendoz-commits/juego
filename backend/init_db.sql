-- ====================================================================
-- GunRun 2D - Script de Inicialización Idempotente para MySQL 8.0+
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `gunrun2d`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `gunrun2d`;

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Partidas Individuales (Scores)
CREATE TABLE IF NOT EXISTS `scores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `score` INT NOT NULL DEFAULT 0,
  `wave` INT NOT NULL DEFAULT 1,
  `kills` INT NOT NULL DEFAULT 0,
  `survival_time` INT NOT NULL DEFAULT 0,
  `accuracy` FLOAT NOT NULL DEFAULT 0.0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_scores_score` (`score`),
  INDEX `idx_scores_user_id` (`user_id`),
  CONSTRAINT `fk_scores_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Estadísticas Acumuladas del Jugador (GameStats)
CREATE TABLE IF NOT EXISTS `game_stats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `total_games` INT NOT NULL DEFAULT 0,
  `total_kills` INT NOT NULL DEFAULT 0,
  `highest_score` INT NOT NULL DEFAULT 0,
  `highest_wave` INT NOT NULL DEFAULT 0,
  `total_playtime_seconds` INT NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_gamestats_user_id` (`user_id`),
  CONSTRAINT `fk_gamestats_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Logros Desbloqueados (UserAchievements)
CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `achievement_key` VARCHAR(50) NOT NULL,
  `unlocked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_user_achievement` (`user_id`, `achievement_key`),
  INDEX `idx_achievements_user` (`user_id`),
  CONSTRAINT `fk_achievements_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

