# Cleanup Instructions

## Overview
This document provides step-by-step instructions for cleaning up the current architecture by removing redundant Next.js API routes and consolidating to a single, clean Next.js-only approach with comprehensive testing and modular design.

## Prerequisites
- [ ] Ensure all current functionality is working
- [ ] Review current architecture understanding
- [ ] Set up testing framework (Jest + Testing Library)
- [ ] Configure test coverage reporting

## Phase 1: Remove Redundant Next.js API Routes

### Remove Summarize Route
- [ ] Delete `app/api/summarize/route.ts`
- [ ] Remove OpenAI dependency from package.json (if only used by this route)
- [ ] Update any imports that reference this route
- [ ] Remove associated test files

### Remove Sweep Channels Route
- [ ] Delete `app/api/sweep-channels/route.ts`
- [ ] Remove OpenAI dependency from package.json (if only used by this route)
- [ ] Update any imports that reference this route
- [ ] Remove associated test files

### Remove Bot Config Route
- [ ] Delete `app/api/bot-config/route.ts`
- [ ] Update any imports that reference this route
- [ ] Remove associated test files

## Phase 2: Remove Express Server

### Remove Express Dependencies
- [ ] Remove `express` from package.json
- [ ] Remove `cors` from package.json
- [ ] Remove `helmet` from package.json
- [ ] Remove `express-rate-limit` from package.json
- [ ] Remove `pg` from package.json

### Remove Express Server Files
- [ ] Delete `src/api/server.js`
- [ ] Delete `src/api/routes/` directory
- [ ] Remove `src/api/` directory entirely
- [ ] Remove all associated test files

### Remove Express Scripts
- [ ] Remove `"api": "node src/api/server.js"` from package.json
- [ ] Remove `"api:dev": "nodemon src/api/server.js"` from package.json

## Phase 3: Create Modular Architecture

### Create Core Modules
- [ ] Create `lib/database/` module with connection and query functions
- [ ] Create `lib/auth/` module with authentication utilities
- [ ] Create `lib/validation/` module with input validation schemas
- [ ] Create `lib/errors/` module with custom error classes
- [ ] Create `lib/rate-limiting/` module with rate limiting logic

### Create Service Layer
- [ ] Create `services/bot-config.service.ts` for bot configuration logic
- [ ] Create `services/action-items.service.ts` for action item operations
- [ ] Create `services/guilds.service.ts` for guild management
- [ ] Create `services/analytics.service.ts` for analytics calculations
- [ ] Create `services/privacy.service.ts` for privacy-related operations

### Create Utility Functions
- [ ] Create `utils/formatting.ts` for data formatting utilities
- [ ] Create `utils/validation.ts` for input validation helpers
- [ ] Create `utils/encryption.ts` for data encryption utilities
- [ ] Create `utils/logging.ts` for structured logging

## Phase 4: Update Discord Bot

### Update Bot Configuration Calls
- [ ] Update Discord bot to use n8n webhook for `/summarize` command
- [ ] Remove calls to `/api/summarize` route
- [ ] Remove calls to `/api/sweep-channels` route
- [ ] Remove calls to `/api/bot-config` route
- [ ] Modularize bot command handlers

### Update Environment Variables
- [ ] Remove `API_BASE_URL` from environment variables
- [ ] Remove `MY_API_AUTH_TOKEN` from environment variables
- [ ] Keep `WEBHOOK_URL` for n8n integration
- [ ] Keep `DATABASE_URL` for direct database access

### Update Bot Dependencies
- [ ] Remove `axios` dependency if only used for API calls
- [ ] Keep `axios` if still needed for n8n webhook calls

## Phase 5: Create New Next.js API Routes

### Create Bot Configuration Route
- [ ] Create `app/api/bot-config/route.ts` (new implementation)
- [ ] Implement GET endpoint for retrieving bot configuration
- [ ] Implement PATCH endpoint for updating bot configuration
- [ ] Add proper authentication and validation
- [ ] Use service layer for business logic
- [ ] Add comprehensive error handling

### Create Action Items Route
- [ ] Create `app/api/action-items/route.ts`
- [ ] Implement CRUD operations for action items
- [ ] Add filtering and pagination
- [ ] Add proper authentication and validation
- [ ] Use service layer for business logic
- [ ] Add comprehensive error handling

### Create Guilds Route
- [ ] Create `app/api/guilds/route.ts`
- [ ] Implement guild management endpoints
- [ ] Add proper authentication and validation
- [ ] Use service layer for business logic
- [ ] Add comprehensive error handling

### Create Analytics Route
- [ ] Create `app/api/analytics/route.ts`
- [ ] Implement analytics and reporting endpoints
- [ ] Add proper authentication and validation
- [ ] Use service layer for business logic
- [ ] Add comprehensive error handling

## Phase 6: Create Comprehensive Unit Tests

### Test Database Module
- [ ] Test database connection functions
- [ ] Test query execution with valid inputs
- [ ] Test query execution with invalid inputs
- [ ] Test connection error handling
- [ ] Test transaction rollback scenarios
- [ ] Test connection pooling behavior

### Test Authentication Module
- [ ] Test valid API key authentication
- [ ] Test invalid API key rejection
- [ ] Test missing API key handling
- [ ] Test rate limiting functionality
- [ ] Test session management
- [ ] Test permission checking

### Test Validation Module
- [ ] Test input validation for all data types
- [ ] Test validation with edge cases (empty strings, null values)
- [ ] Test validation with malicious inputs (SQL injection attempts)
- [ ] Test validation with oversized inputs
- [ ] Test validation with malformed JSON
- [ ] Test validation error message formatting

### Test Service Layer
- [ ] Test bot-config service CRUD operations
- [ ] Test action-items service with all operations
- [ ] Test guilds service with all operations
- [ ] Test analytics service calculations
- [ ] Test privacy service data handling
- [ ] Test service error handling and recovery

### Test API Routes
- [ ] Test all GET endpoints with valid requests
- [ ] Test all POST endpoints with valid data
- [ ] Test all PATCH endpoints with valid updates
- [ ] Test all DELETE endpoints with valid IDs
- [ ] Test endpoints with invalid authentication
- [ ] Test endpoints with malformed requests
- [ ] Test endpoints with missing required fields
- [ ] Test endpoints with oversized payloads
- [ ] Test endpoints with invalid data types
- [ ] Test rate limiting on all endpoints

### Test Discord Bot
- [ ] Test `/summarize` command with valid inputs
- [ ] Test `/summarize` command with invalid time ranges
- [ ] Test `/config` commands with valid parameters
- [ ] Test `/config` commands with invalid permissions
- [ ] Test bot error handling for API failures
- [ ] Test bot error handling for network issues
- [ ] Test bot rate limiting behavior
- [ ] Test bot command validation

### Test n8n Workflows
- [ ] Test Manual Sweep workflow with valid input
- [ ] Test Manual Sweep workflow with empty messages
- [ ] Test Manual Sweep workflow with malformed data
- [ ] Test Time Sweep workflow with valid configuration
- [ ] Test Time Sweep workflow with no active configs
- [ ] Test Time Sweep workflow with API failures
- [ ] Test workflow error handling and recovery
- [ ] Test workflow data validation

### Test Edge Cases
- [ ] Test with maximum message lengths
- [ ] Test with special characters in inputs
- [ ] Test with Unicode characters
- [ ] Test with concurrent requests
- [ ] Test with database connection failures
- [ ] Test with network timeouts
- [ ] Test with memory pressure scenarios
- [ ] Test with invalid JSON payloads

## Phase 7: Update Database Schema

### Create New Migrations
- [ ] Create migration for workspace-based organization
- [ ] Update bot_config table to support multi-platform
- [ ] Add platform_type and platform_id columns
- [ ] Create unified action_items table structure
- [ ] Test migration rollback scenarios

### Update Existing Tables
- [ ] Rename guild_id to workspace_id where appropriate
- [ ] Add platform_type column to relevant tables
- [ ] Update foreign key relationships
- [ ] Test data integrity after migrations

## Phase 8: Update Discord Bot Integration

### Update Configuration Commands
- [ ] Update `/config` command to use new API routes
- [ ] Update bot to use direct database queries where appropriate
- [ ] Remove dependency on old API endpoints
- [ ] Add comprehensive error handling

### Update Scheduled Sweep
- [ ] Update scheduled sweep to use n8n workflow
- [ ] Remove calls to `/api/sweep-channels`
- [ ] Ensure proper error handling
- [ ] Add retry logic for failed operations

## Phase 9: Test and Validate

### Test Discord Bot
- [ ] Test `/summarize` command with n8n webhook
- [ ] Test `/config` commands with new API routes
- [ ] Test scheduled sweep functionality
- [ ] Verify all bot functionality works
- [ ] Test bot with high message volumes

### Test API Routes
- [ ] Test all new Next.js API routes
- [ ] Verify authentication works
- [ ] Test error handling
- [ ] Verify database operations
- [ ] Test with concurrent requests

### Test n8n Workflows
- [ ] Test Manual Sweep workflow
- [ ] Test Time Sweep workflow
- [ ] Verify webhook endpoints work
- [ ] Test error handling in workflows
- [ ] Test workflow performance under load

## Phase 10: Update Documentation

### Update API Documentation
- [ ] Update API_SPECIFICATION.md with new routes
- [ ] Remove references to Express server
- [ ] Update endpoint documentation
- [ ] Add testing documentation

### Update Setup Guides
- [ ] Update API_SETUP_GUIDE.md
- [ ] Remove Express server setup instructions
- [ ] Update environment variable documentation
- [ ] Add testing setup instructions

### Update Project Documentation
- [ ] Update README.md with new architecture
- [ ] Update PROJECT_ROADMAP.md
- [ ] Remove references to old architecture
- [ ] Add testing guidelines

## Phase 11: Clean Up Dependencies

### Remove Unused Dependencies
- [ ] Remove any unused npm packages
- [ ] Clean up package.json
- [ ] Update package-lock.json
- [ ] Verify no breaking changes

### Update TypeScript Types
- [ ] Remove unused type definitions
- [ ] Update type definitions for new API structure
- [ ] Ensure type safety across the application
- [ ] Add comprehensive type coverage

## Phase 12: Final Validation

### Performance Testing
- [ ] Test API response times under load
- [ ] Test n8n workflow performance
- [ ] Verify database query performance
- [ ] Test memory usage patterns
- [ ] Test CPU usage under stress

### Security Validation
- [ ] Verify authentication works correctly
- [ ] Test rate limiting effectiveness
- [ ] Verify data privacy features
- [ ] Test input sanitization
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention

### Deployment Testing
- [ ] Test deployment to Vercel
- [ ] Verify environment variables
- [ ] Test production functionality
- [ ] Test rollback procedures

## Phase 13: Update Configuration Files

### Update Render Configuration
- [ ] Update render.yaml for new architecture
- [ ] Remove Express server configuration
- [ ] Update environment variables
- [ ] Test deployment pipeline

### Update Environment Files
- [ ] Update .env.example
- [ ] Remove unused environment variables
- [ ] Add new required variables
- [ ] Document all environment variables

## Phase 14: Final Cleanup

### Remove Old Files
- [ ] Remove any remaining old API files
- [ ] Clean up unused imports
- [ ] Remove old configuration files
- [ ] Remove old test files

### Update Git History
- [ ] Commit all changes
- [ ] Add appropriate commit messages
- [ ] Update branch if necessary
- [ ] Create release tags

## Success Criteria
- [ ] All Discord bot functionality works
- [ ] n8n workflows function correctly
- [ ] API routes respond properly
- [ ] Database operations work
- [ ] No errors in console
- [ ] All unit tests pass with >80% coverage (90%+ for critical business logic)
- [ ] All integration tests pass
- [ ] Performance tests meet requirements
- [ ] Security tests pass
- [ ] Documentation is updated
- [ ] Architecture is clean and consistent
- [ ] Code is modular and maintainable
- [ ] Error handling is comprehensive
- [ ] Edge cases are properly handled
