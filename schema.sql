CREATE DATABASE IF NOT EXISTS gpas_db;
USE gpas_db;

CREATE TABLE IF NOT EXISTS profiles (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    github_id           BIGINT          NOT NULL UNIQUE,
    username            VARCHAR(100)    NOT NULL UNIQUE,
    name                VARCHAR(255)    DEFAULT NULL,
    avatar_url          TEXT            DEFAULT NULL,
    bio                 TEXT            DEFAULT NULL,
    location            VARCHAR(255)    DEFAULT NULL,
    blog                VARCHAR(500)    DEFAULT NULL,
    company             VARCHAR(255)    DEFAULT NULL,
    email               VARCHAR(255)    DEFAULT NULL,
    twitter_username    VARCHAR(255)    DEFAULT NULL,
    public_repos        INT             DEFAULT 0,
    public_gists        INT             DEFAULT 0,
    followers           INT             DEFAULT 0,
    following           INT             DEFAULT 0,
    account_created_at  DATETIME        DEFAULT NULL,
    account_age_days    INT             DEFAULT 0,
    activity_score      FLOAT           DEFAULT 0,
    profile_url         VARCHAR(500)    DEFAULT NULL,
    analyzed_at         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_username (username),
    INDEX idx_activity_score (activity_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS repositories (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    profile_id          INT             NOT NULL,
    repo_name           VARCHAR(255)    NOT NULL,
    description         TEXT            DEFAULT NULL,
    stars               INT             DEFAULT 0,
    forks               INT             DEFAULT 0,
    primary_language    VARCHAR(100)    DEFAULT NULL,
    repo_url            VARCHAR(500)    DEFAULT NULL,
    created_at          DATETIME        DEFAULT NULL,

    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS languages (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    profile_id          INT             NOT NULL,
    language            VARCHAR(100)    NOT NULL,
    bytes               BIGINT          DEFAULT 0,
    percentage          FLOAT           DEFAULT 0,

    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id),
    UNIQUE KEY uq_profile_language (profile_id, language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
