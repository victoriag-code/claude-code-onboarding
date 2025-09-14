# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-page HTML application that implements an interactive onboarding wizard for Claude Code Enterprise customers. The wizard guides different types of customers (new Claude Code customers, C4E customers, and existing API 1P customers) through their specific onboarding flows.

## Architecture

The application is entirely self-contained in `v3claude-code-wizard.html` with:
- Embedded CSS styling using a warm color palette (#D4A574, #F5F3F0, #E6DDD4)
- Inline JavaScript for wizard logic and state management
- No external dependencies or build process required

## Key Components

### Customer Flows
The wizard supports three customer types, each with customized steps:
1. **New Claude Code Customer** - Fresh onboarding with account creation
2. **C4E Customer** - Existing Claude for Enterprise customers adding Claude Code
3. **API 1P Customer** - Existing API customers transitioning to Claude Code

### State Management
- `currentStep`: Tracks wizard progress
- `selectedFlow`: Stores selected customer type
- `customerData`: Collects form responses

### Core Functions
- `initWizard()`: Initializes the wizard on page load
- `showStep(step)`: Renders each step based on flow configuration
- `validateForm()`: Validates required form fields
- `saveFormData()`: Persists form data to customerData object
- `selectFlow(flow)`: Sets customer type and begins flow
- `showEndScreen()`: Displays completion screen with summary

## Development Commands

Since this is a standalone HTML file, no build or installation commands are needed:

```bash
# Open the wizard in a browser
open v3claude-code-wizard.html

# Or serve locally with Python
python3 -m http.server 8000
# Then navigate to http://localhost:8000/v3claude-code-wizard.html

# Or with Node.js http-server (if installed)
npx http-server
```

## Testing & Validation

For HTML/CSS/JavaScript validation:
```bash
# Validate HTML (requires html-validate or similar tool if installed)
# Manual testing: Open in multiple browsers to verify compatibility

# Check for JavaScript errors
# Open browser console (F12) and look for errors during interaction
```

## Making Changes

When modifying the wizard:
1. Form fields are defined in the `flows` object for each customer type
2. Styling uses embedded CSS - maintain the warm color scheme
3. All links should open in new tabs (`target="_blank"`)
4. Form validation happens client-side in `validateForm()`
5. Customer data is collected but not submitted anywhere (display-only in summary)