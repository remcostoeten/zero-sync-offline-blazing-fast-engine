# 🚀 Turso Offline Sync Demo

This project demonstrates [Turso Offline Sync](https://turso.tech/blog/turso-offline-sync-public-beta) capabilities, allowing your applications to work seamlessly both online and offline with automatic synchronization.

## ✨ Features

- **Offline-First**: Works without internet connection
- **Automatic Sync**: Syncs data when connection is restored
- **Local Database**: Uses SQLite for fast local operations
- **Conflict Detection**: Built-in conflict handling
- **TypeScript Support**: Full type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Turso CLI installed and authenticated

### Installation

```bash
npm install
```

### Setup Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Authenticate
turso auth login

# Create database group and database
turso group create --location aws-us-east-1 offline
turso db create --group offline offline

# Get credentials
turso db show offline
turso db tokens create offline
```

### Configure Environment

Copy `.env.example` to `.env` and fill in your Turso credentials:

```env
TURSO_SYNC_URL=https://your-database-name-your-username.turso.io
TURSO_AUTH_TOKEN=your_auth_token_here
```

### Run the Demos

```bash
# Notes demo (basic offline sync)
npm run dev

# Field data collection demo
npm run field-data

# Build and run production
npm run build
npm start
```

## 📁 Project Structure

- `src/index.ts` - Basic notes demo with offline sync
- `src/field-data.ts` - Field data collection demo
- `.env` - Your Turso credentials (create from .env.example)
- `local.db` - Local SQLite database (auto-created)
- `field-data.db` - Field data database (auto-created)

## 🔧 How It Works

1. **Local Database**: Uses SQLite for fast, offline operations
2. **Offline Operations**: All database operations work without internet
3. **Automatic Sync**: When connection is restored, data syncs automatically
4. **Conflict Detection**: Built-in handling for data conflicts

## 📚 Learn More

- [Turso Offline Sync Blog Post](https://turso.tech/blog/turso-offline-sync-public-beta)
- [Turso Documentation](https://docs.turso.tech)
- [libsql Client Documentation](https://github.com/libsql/libsql-client-ts)

## ⚠️  Beta Status

**Turso Offline Sync is currently in beta quality, and not yet recommended for production use.** During the beta period, there are no durability guarantees, which means data loss is possible.

## 🏢 Enterprise Application Features

The enterprise application includes a comprehensive set of features:

### 👥 User Management
- Role-based access control (admin, manager, employee, viewer)
- Department organization
- User activity tracking

### 📋 Project Management
- Project lifecycle management (planning, active, on-hold, completed, cancelled)
- Priority levels (low, medium, high, critical)
- Budget tracking and timeline management
- Manager assignment and team coordination

### ✅ Task Management
- Task creation and assignment
- Status tracking (todo, in-progress, review, done)
- Priority management
- Time estimation and actual time tracking
- Due date management

### ⏱️  Time Tracking
- Detailed time logging with descriptions
- Billable vs non-billable time tracking
- Project and task association
- Time entry history and reporting

### 💬 Collaboration
- Project and task comments
- Threaded discussions
- User activity tracking
- Team communication tools

### 📊 Reporting & Analytics
- Project performance reports
- User workload analysis
- Time tracking analytics
- Budget vs actual tracking
- Completion rate analysis

### 🔄 Sync Management
- Real-time sync status monitoring
- Conflict detection and resolution
- Offline data persistence
- Automatic sync when online
- Manual sync control

### 📝 Audit & Compliance
- Comprehensive audit logging
- User action tracking
- Data change history
- Compliance reporting
- Security monitoring

### Run the Enterprise Application

```bash
# Run the complete demo showcase
npm run demo

# Run the interactive CLI
npm run cli

# Run the enterprise app directly
npm run enterprise
```

## 📁 Enhanced Project Structure

- `src/index.ts` - Basic notes demo with offline sync
- `src/field-data.ts` - Field data collection demo
- `src/enterprise-app.ts` - **Full enterprise application with all features**
- `src/enterprise-cli.ts` - **Interactive CLI for enterprise app**
- `src/demo-showcase.ts` - **Comprehensive demo showcasing all features**
- `.env` - Your Turso credentials (create from .env.example)
- `local.db` - Local SQLite database (auto-created)
- `field-data.db` - Field data database (auto-created)
- `enterprise.db` - **Enterprise application database (auto-created)**

## 💰 Finance Management Application

A comprehensive financial management system built with Turso Offline Sync, featuring:

### 🏗️  Core Entities
- **Transaction**: id, amount, type (income|expense), category, note, date
- **Category**: id, name, type, color, icon
- **Audit Log**: Comprehensive tracking of all changes

### 🌐 API Endpoints

#### Categories

### 🌐 API Endpoints

#### Categories
- `POST /categories` - Add category
- `GET /categories` - List categories (with optional type filter)
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Remove category

#### Transactions
- `POST /transactions` - Add transaction
- `GET /transactions` - List with filters (date range, category, type, limit)
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Remove transaction

#### Summary & Analytics
- `GET /summary` - Financial summary with overall totals, monthly breakdown, and category analysis

#### Admin Endpoints
- `POST /admin/sync` - Force data synchronization
- `GET /admin/sync-status` - Get sync status across all tables
- `POST /admin/populate-demo` - Populate demo data
- `GET /admin/audit-log` - View audit trail

### 🎨 Modern React UI
- **Dashboard**: Overview with financial metrics and top categories
- **Category Management**: Create, edit, and delete income/expense categories
- **Transaction Management**: Full CRUD operations for financial transactions
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live data synchronization with the API

### 🚀 Running the Finance Application

1. **Start the API Server**: `npm run api`
2. **Start the UI**: `npm run ui` (opens in browser at http://localhost:3001)
3. **Run Core App**: `npm run finance` (CLI demo)

### 🛡️  Features
- **Request Validation**: Zod schemas for all API endpoints
- **Error Handling**: Comprehensive error handling with detailed logging
- **Security**: Helmet.js, CORS, and rate limiting
- **Audit Logging**: Complete trail of all data changes
- **Offline Sync**: Turso Offline Sync for local-first architecture

## 🎯 Quick Start Guide

### 1. Start the API Server
```bash
npm run api
```

### 2. Open the UI
```bash
npm run open-ui
```
This will open the React application in your default browser.

### 3. Alternative: Run Core App
```bash
npm run finance
```
Run the finance application in the terminal with demo data.

## 📁 Project Structure

```
zero-sync-offline-blazing-fast-engine/
├── src/
│   ├── index.ts              # Basic notes demo
│   ├── field-data.ts         # Field data collection demo
│   ├── enterprise-app.ts     # Enterprise application demo
│   ├── enterprise-cli.ts     # Interactive CLI for enterprise app
│   ├── demo-showcase.ts      # Comprehensive demo showcase
│   ├── finance-app.ts        # Finance application core
│   ├── finance-api.ts        # Express.js API server
│   └── finance-ui.tsx        # React UI components
├── public/
│   └── index.html            # Finance UI HTML file
├── .env                      # Environment configuration
├── package.json              # Dependencies and scripts
├── open-ui.sh               # UI launcher script
└── README.md                 # This file
```

## 🎯 Savings Management Features

### 🎯 Savings Goals
- **Create Goals**: Set target amounts, deadlines, and descriptions
- **Progress Tracking**: Visual progress bars and percentage completion
- **Customization**: Color coding and emoji icons for each goal
- **Deadline Management**: Set and track target dates for goals

### 💰 Savings Transactions
- **Deposits & Withdrawals**: Track money going in and out of goals
- **Automatic Updates**: Goal progress updates automatically with transactions
- **Transaction History**: Complete audit trail of all savings activities

### 📊 Enhanced Financial Summary
- **Savings Overview**: Total targets, progress, and remaining amounts
- **Goal Progress**: Individual goal tracking with visual indicators
- **Integrated Dashboard**: Savings data alongside income/expense metrics

#### Savings Goals
- `POST /savings` - Add savings goal
- `GET /savings` - List savings goals with progress
- `PUT /savings/:id` - Update savings goal
- `DELETE /savings/:id` - Remove savings goal

#### Savings Transactions
- `POST /savings/:id/transactions` - Add transaction to goal
- `GET /savings/:id/transactions` - Get transactions for a goal

## 🎉 Complete Finance Management System

### ✨ What We've Built
- **Complete Financial Management**: Income, expenses, categories, and savings goals
- **Modern React UI**: Beautiful, responsive interface with Tailwind CSS
- **RESTful API**: Full CRUD operations with validation and error handling
- **Turso Offline Sync**: Local-first architecture with cloud synchronization
- **Comprehensive Features**: Dashboard, reporting, audit logging, and more

## 🚀 Advanced Financial Features

### 💰 Budget Management
- **Category Budgets**: Set monthly/yearly spending limits per category
- **Budget vs Actual**: Compare planned vs actual spending
- **Progress Tracking**: Visual indicators for budget utilization
- **Period Management**: Support for monthly and yearly budget cycles

### 🔄 Recurring Transactions
- **Automated Transactions**: Set up weekly/monthly/yearly recurring income and expenses
- **Smart Scheduling**: Automatic generation of transactions based on recurrence rules
- **Due Date Management**: Track when next transactions are due
- **Flexible Rules**: Support for weekly, monthly, and yearly patterns

### 🏷️  Tag System
- **Flexible Classification**: Add multiple tags to transactions for better organization
- **Color Coding**: Visual tag identification with custom colors
- **Many-to-Many**: Associate multiple tags with multiple transactions
- **Enhanced Filtering**: Filter transactions by tags for better analysis

### 📊 Advanced Analytics
- **Trend Analysis**: Monthly income/expense growth tracking
- **Budget Performance**: Compare actual spending vs budgeted amounts
- **Category Averages**: Average spending per category analysis
- **Savings Rate**: Calculate percentage of income saved monthly
- **Progress Tracking**: Visual indicators for budget and savings goals

## 🔌 Enhanced API Endpoints

### 💰 Budget Management API
- **POST /budgets** - Create new budget for category
- **GET /budgets** - List all active budgets
- **PUT /budgets/:id** - Update budget details
- **DELETE /budgets/:id** - Remove budget

### 🔄 Recurring Transactions API
- **POST /recurring** - Create recurring transaction
- **GET /recurring** - List all recurring transactions
- **PUT /recurring/:id** - Update recurring transaction
- **DELETE /recurring/:id** - Remove recurring transaction
- **POST /recurring/generate** - Generate due transactions

### 🏷️  Tags API
- **POST /tags** - Create new tag
- **GET /tags** - List all tags
- **PUT /tags/:id** - Update tag details
- **DELETE /tags/:id** - Remove tag
- **POST /transactions/:id/tags** - Add tags to transaction
- **DELETE /transactions/:id/tags** - Remove tags from transaction
- **GET /transactions/:id/tags** - Get tags for transaction

## 🎯 What We've Built

### ✨ Advanced Financial Management System
- **Complete Budget Management**: Set and track spending limits per category
- **Automated Recurring Transactions**: Weekly/monthly/yearly income and expense automation
- **Flexible Tag System**: Multi-dimensional transaction classification
- **Advanced Analytics**: Trends, growth rates, and performance metrics
- **Enhanced Reporting**: Budget vs actual, savings progress, and category analysis

### 🚀 Technical Features
- **RESTful API**: Full CRUD operations with Zod validation
- **CORS Support**: Works with file:// origins for local development
- **Turso Offline Sync**: Local-first architecture with cloud synchronization
- **TypeScript**: Full type safety and modern development experience
- **SQLite Database**: Fast, reliable local data storage
