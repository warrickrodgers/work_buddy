## Setup

### Windows
First things first, you'll need WSL as it makes life much easier. For congruency, this was built with Ubuntu 24 lts.

### NodeJS
Start with a good ol `sudo apt update && sudo apt upgrade` followed by  a `sudo apt install nodejs` and a `sudo apt install npm`. This should be sufficient, but verify versioning and try `npm install` in the root project directory.

### PostGres, Prisma & Express
Running the `npm install` should have you covered for prisma and express, but verify after the Postgres install. For Postgres:

A good ol: `sudo apt install postgresql postgresql-contrib`

Make sure you create a `.env` file **(not committed)** with parameters similar to this:

```
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/dev"
```

And then make sure to create a `dev` db in Postgres. Start with `sudo passwd postgres`, create your password, and then `sudo -u postgres psql` to log in. Create a DB with `create database dev;` in psql. Don't forget to terminate your `db` command with a `;`. I had to learn that the hard way.

Oncxe your DB is created run the usual Prisma commands. If you're stuck I followed either ChatGPT or thhe following:
[Prisma DB Seeding](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding)

If the DB Seeding is successful you should see output as follows:

```
{
  testUser: {
    id: 1,
    email: 'test@workbuddy.io',
    first_name: 'Test',
    last_name: 'Buddy',
    created_at: 2025-04-17T03:05:50.158Z,
    last_login: 2025-04-17T03:05:50.158Z,
    job_title: 'Marketing Director',
    company: 'WorkBuddy',
    password_hash: 'g1bb3ri$h',
    auth_method: 'none'
  }
}
🌱 Seeding completed
```

## Contribution Guidelines
To Come!