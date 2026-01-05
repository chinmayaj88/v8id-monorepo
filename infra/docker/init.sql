-- Initial database setup script
-- This runs when the MySQL container is first created

-- Create database if it doesn't exist (already created via MYSQL_DATABASE env var)
-- But we can add custom initialization here if needed

-- Example: Create additional users or set permissions
-- CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'app_password';
-- GRANT ALL PRIVILEGES ON v8id_cloud.* TO 'app_user'@'%';
-- FLUSH PRIVILEGES;

