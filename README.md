# MES Pensions Platform - Developer Interview

## Code Sample for Review

This is a section of the code from the typescript code file that handles accessing and consuming data from a 3rd party platform that provides pension fund details for MES clients and advisers.

## Tech Stack

The platform conasists of 2 applications and a database. all hosted on AWS.

Frontend Application
Provides access to Clients, Advisers and internal administrators - written in React, with Vite, Axios, ApexCharts & a Material UI interface

Backend Application
Manages the backend app logic and the API integrations to 2 3rd party platforms called Platinum & Tercero - written in Node.js/Adonis, Typescript, with Lucid, Node cron jobs - the database is PostgreSQL

The Code sample provided is a segment of the API functionality for consuming data from the Platinum 3rd party platform. The functions call various data components from Platinum to pull back fund information and updates, based on member/user IDs & fund/portfolio IDs.
There are known systematic issues with the API and each day the system reports, via email alerts, in the region of 5-10 errors, typically HTTP 401 errors. An example of the email report (redacted to remove any security risks) is also included in this readme below.

## Code Review

Please take a look at the code snippet included in this repo. In your interview we will discuss your opinion of the code and how this has been written. What, if anything, should be improved or done differently? Do you think the code might be part of the cause of the API errors? 
We do not expect you to do a deep dive into the code, nor do we expect you to provide fixes or solutions at this stage. Rather we are looking for how you would approach code reviews and coding, and what you consider to be good practice. 
In the interview you can expect to spend about 15min discussing your findings and/or opinion


## Email Error Alert

From:        MES Pensions <xxxxxxxxxxx@mespensions.com>
Sent on:     Tuesday, August 5, 2025 4:00:01 PM
To:          person1 <xxxxxxxxxxxxxxx@mespensions.com>; person2 <xxxxxxxxxxxxxxx@mespensions.com>; person3 <xxxxxxxxxxxxxxx@mespensions.com>
Subject:     Platinum API Error Notification

      An error occurred while accessing the Platinum API.
      API Name: Beneficiaries  /NominatedBeneficiaries
      Status: 401
      Error Message: HTTP 401: Unauthorized
      Request Details:
      Method: GET
      URL: http://xxxxxxxxxx.mespensions.com/ls/click?upn=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      Headers: {
  "Accept": "application/json, text/plain, */*",
  "Authorization": "Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "User-Agent": "axios/1.6.8",
  "Accept-Encoding": "gzip, compress, deflate, br"
}
      Request Data: {
  "platinumId": "123456789"
}

      Response Data: ""
