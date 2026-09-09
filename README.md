# Genome Lens (Full-Stack)
## Development
The app on this branch uses [Next.js](https://nextjs.org/), a framework for developing the server and client side of a web application via React.
Additionally, we use [Kysely](https://kysely.dev/), a type-safe API for making SQL database queries, for communicating with our PostgreSQL database.
[PostgreSQL](https://www.postgresql.org/) stores application data, including podcast episode information and the state of background jobs.
For asynchronous podcast generation, the application uses the [Graphile Worker](https://worker.graphile.org/) to manage a PostgreSQL-backed job queue.

## Deployment
The full-stack web app was deployed to the Ma'ayan Lab of Computational Systems Biology's dev cluster at https://genome-lens.k8s.maayanlab.cloud/ 

## Getting Started in Local Development

```python

cp .env.example .env
#Create the local environment file

docker compose up -d
#Start the Postgres database

npm install
#Install dependencies

python3 -m venv .venv
source .venv/bin/activate
#Create a python virtual environment

pip install -r requirements.txt
#Install python requirements

npx kysely migrate:latest
#Initialize the PostgreSQL database with Kysely migrations

npm run dev
#Start the Next.js web app

npm run worker
#In another terminal run the Graphile Worker

```
