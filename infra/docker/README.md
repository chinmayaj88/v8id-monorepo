# Docker Setup for Local Development

This directory contains Docker Compose configuration for local development with MySQL and Adminer.

## Services

- **MySQL 8.0** - Database server (port 3306)
- **Adminer** - Database management UI (port 8080)

## Quick Start

1. **Start services:**
   ```bash
   docker-compose up -d
   ```

2. **Stop services:**
   ```bash
   docker-compose down
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop and remove volumes (clean slate):**
   ```bash
   docker-compose down -v
   ```

## Access

- **MySQL:** `localhost:3306`
  - Database: `v8id_cloud`
  - User: `v8id_user`
  - Password: `v8id_password`
  - Root Password: `rootpassword`

- **Adminer:** http://localhost:8080
  - System: `MySQL`
  - Server: `mysql`
  - Username: `v8id_user` (or `root`)
  - Password: `v8id_password` (or `rootpassword`)
  - Database: `v8id_cloud`

## Environment Variables

Create a `.env` file in the `backend/` directory with:

```env
DATABASE_URL="mysql://v8id_user:v8id_password@localhost:3306/v8id_cloud"
```

## Notes

- Data persists in the `mysql_data` volume
- To reset the database, run `docker-compose down -v` (this removes all data)

