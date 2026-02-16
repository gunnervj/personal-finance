# Idea

The idea is to create a personal finance management system that can help users manage their personal finances. A user should be able to register into the website. We do not need many data from user except email, firstname, lastname and password. email can be used as username which is the unique identifier for the user. We will be using keycloak for the registration and sign in functionality.

Upon registration user automatically login and move into the application. Application to show the dashboard page. Since this is the firstime login,  we should open a modal window asking for currency preference, emergency fund target(example emergency fund target can be 3-6 months of salary) and after tax monthly salary. Uers cannot skip this, we can set a default currency as USD, emergency fund target as 3 months of salary and monthly salary as 0. Initially MVP will support only USD. Once these information is set, user can create budget for their monthly expenses. 

Dashboard page to show a classic design where we have a collapsible menu on the left side. Righ side to show recent transactions in a table. Middle portion will show the title of the page and the content of the page. Content of the page will have to show nice widgets one showing the Expenses summary till date without any details but just the total. On the bottom of the widget show how much of budget has we burned through in percentage. If we are under 50%, it will be green . Above 50%, orange and 80% and above it will be red. We should also show the emergency fund target in another widget for MVP.

Another widget to show a nice doughnut chart showing the distribution of expenses till date. And a final widget to show a barchart of monthly expenses till date for the current year against previous year.

On the left menu, we will have option of budget. User can click on a budget and see the active budget(which is of current year). If none, show a nice little message to create a budget. Buttons will be there to create a monthly budget for current year. Budget will be for a month grouped under a year. The same budget is going to be copied for every month.  We will not support creation of budgets for previous years. Also we will not support creation of budgets for future years unless it is december of the current year. Users can copy current budget to next year (this is going to be the default behavior if user does not create a budget for next year).

**Budget Creation and Management Rules:**
- Once a budget is created for the current year, the "Create Budget" button should be hidden for that year
- In December, users can see the "Create Budget" button to create next year's budget
- Users can always edit existing budgets (modify amounts, add/remove expense types)
- Users can only delete a budget if there are NO transactions recorded against it
- If a budget has transactions, deletion should be prevented with an appropriate error message

We are not going to have fixed budget expense types. User can create their own budget expense types. User can add, edit and delete budget expense types. Types can be like rent, utilities, groceries, etc. We should be able to calculate and show the user in real time how much they are allocating for each budget expense type in terms of their monthly salary. We should also show how much they are left with after deducting all the budget expense types for potential monthly savings target. We should also give the flexibiltiy to user to mark an expense type as optional or mandatory. Mandatory expense types can be calculated to form an emergency fund requirement. Once a expense type is created, it will be available to the user to be used in other budgets as well. So it is global to the user and does not have to create it every time they create a budget. Some of the expense types can be applicable only for a particular month. This can be used to record one time expenses.

If user already has expense types created, we should show them in the list of expense types to be used in budget. User can select the expense types to be used in budget. User can also create new expense types in the budget creation modal window. Users cannot delete expense types that are already used in a budget. However user can choose to remove an expense type from current budget and also option to edit the amount allocated for the expense type.

The budget creation page should show a doughnut chart showing the distribution of budget expense types.

THe next item in the left menu is transactions.

Users should see a nice table showing their recent transactions. If no transactions are available, we should show a nice message to record a transaction. Transactions should be ordered by date in descending order. Each transaction should a ellipsis button to edit or delete the transaction. The ellipsis should open a popover to edit or delete the transaction. When clicked edit, open a modal window to edit the transaction. When clicked delete, ask for confirmation and delete the transaction.

User can record their expense transactions and tag it to budget expense types. With every expense transaction, we should be able to calculate and show the user in real time how much they are left with for that particular budget expense type. We should also show the user in real time how much they are left with for the month and also the total expenses till date for the month. 

The top of the page should show a summary of the expenses till date for the month as nice widgets.

## Flows


### First Time Flow

User Registers -> User logs in -> User sets preferences (Modal Window) -> sees dashboard -> User creates budget (Modal Window) -> User records transactions (Modal Window) -> User views dashboard

### Registered User Flow

User Logs in -> User views dashboard -> User records transactions (Modal Window) -> User views dashboard



## Website Theme

use sample_dashboard_design for theme reference including the color scheme, widgets, side bar etc.

  - More minimal and professional
  - Electric blue accents throughout
  - Darker, more sophisticated palette
  - Cleaner spacing and typography
  - Modern tech aesthetic

### Colors
Supports only dark mode. Colors are going to be purple, violet and blue tones with deep black backgrounds with purple violet accents/gradients. 

### Widgets
Widgets should be rounded and have a nice shadow. 

### Modals
Modal should be rounded and have a nice shadow. Modals shall open and close with a nice animation. 

### Fonts
Roboto and Lato

### LOGO

Sample logo is kept under the resources folder. We need to make background transparent and use it as a base to create a new logo. 

### Tables
Tables should be rounded and have a nice shadow. Tables shall be scrollable. Do not load the entire table at once. Load only the first 10 rows and show a load more button to load more rows. 

Use table_design.png for reference.

### Cards
Cards should be rounded and have a nice shadow and should have a nice animation when hovered over.

### Toast
Toast should be rounded and have a nice shadow and should have a nice animation when hovered over. It should be displayed at the bottom right corner of the screen. It should be displayed for 3 seconds. It should be displayed for success, error and warning messages.

## Tech Stack

UI - Next.js with React, TailwindCSS
Backend -  Quarkus Microservices
Authentication - Keycloak
Database - PostgreSQL

I am not hosting the app anywhere until things are ready. Development will be done locally with docker-compose.

This is for the MVP.

## Security & Authentication Configuration

**JWT Token Validation:**
- Backend services use standard JWT signature verification (fast, no network calls)
- Token lifespans should be configured in Keycloak admin console:
  - Access Token Lifespan: 5-15 minutes (recommended)
  - SSO Session Idle: 30 minutes
  - SSO Session Max: 10 hours
- Tokens are stateless - once issued, valid until expiration
- Frontend automatically redirects to login on token expiration (401 errors)
- Do NOT use `verify-access-token-with-user-info=true` - causes compatibility issues with NextAuth

**Toast Notifications:**
- All error/success messages displayed as toast notifications (bottom-right corner)
- 3-second auto-dismiss with slide-in animation
- Used throughout application instead of inline error messages



Create a project plan. Break down the project so that we can start and complete it step by step. We should be able to track progress of the project.

Future additions
- AI based expense transaction recording.
- Ability to manage net worth.
- Ability to create investment plans.
- Ability to create retirement plans.