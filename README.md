# MES Pensions Platform - Developer Interview

## Code Sample for Review

This is a section of the code from the typescript code file that handles accessing and consuming data from a 3rd party platform that provides pension fund details for MES clients and advisers.

## Tech Stack

The platform conasists of 2 applications and a database. all hosted on AWS.

Frontend Application
Provides access to Clients, Advisers and internal administrators - written in React, with Vite, Axios, ApexCharts & a Material UI interface

Backend Application
Manages the backend app logic and the API integrations to 2 3rd party platforms called Platinum & Tercero - written in Node.js/Adonis, Typescript, with Lucid, Node cron jobs - the database is PostgreSQL

The Code sample provided is a segment of the API functionality for consuming data from the Platinum 3rd party platform. The functions call various data components from Platinum to pull back fund information and updates, based on member/user IDs & fund/portfolio IDs

