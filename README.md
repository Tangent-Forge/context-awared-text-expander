# Context-Awared Text Expander

## Overview

Context-Awared Text Expander is a Google Workspace add-on that helps users create and use smart text shortcuts that adapt to context. Define abbreviations that expand into full text, with variables and conditional logic based on document type and content.

## Features

- **Smart Shortcuts**: Create abbreviations that expand into full text
- **Context Awareness**: Adapts expansions based on document type and content
- **Variables**: Use dynamic variables like date, time, user name
- **Conditional Logic**: Different expansions based on context
- **Template Library**: Pre-built templates for common scenarios
- **Sync Across Docs**: Share shortcuts across Google Docs
- **Usage Analytics**: Track shortcut usage patterns
- **Import/Export**: Backup and share shortcut libraries

## Target Users

- **Writers**: Quickly insert common phrases and boilerplate
- **Support Teams**: Use consistent response templates
- **Developers**: Insert code snippets and documentation
- **Sales Teams**: Use consistent messaging
- **Anyone** who repeats text frequently

## Pricing

- **Free Tier**: Up to 20 shortcuts
- **Pro Tier ($6.99/month)**: Unlimited shortcuts, variables, templates
- **Team Tier ($14.99/month)**: Team sharing, analytics, priority support

## Timeline

- **Phase 1** (Week 1-2): Core shortcut expansion features
- **Phase 2** (Week 3-4): Context awareness and variables
- **Phase 3** (Week 5-6): Template library and sharing
- **Phase 4** (Week 7-8): Analytics and advanced features

## Architecture

### Backend (Apps Script)
- **ShortcutEngine**: Parse and expand shortcuts
- **ContextAnalyzer**: Determine document context
- **VariableResolver**: Resolve dynamic variables
- **TemplateManager**: Manage template library
- **SyncEngine**: Sync shortcuts across documents
- **AnalyticsTracker**: Track usage patterns

### Frontend (HTML Service)
- **Shortcut Manager UI**: Create and edit shortcuts
- **Expansion Panel**: View and edit expansions
- **Template Gallery**: Browse templates
- **Settings Panel**: Configure preferences
- **Analytics Dashboard**: View usage statistics

### Data Storage
- **PropertiesService**: Store shortcut definitions
- **Docs API**: Access document content
- **Drive API**: Share shortcut libraries

## Installation

1. Open Google Apps Script project
2. Copy `Code.gs` and `Sidebar.html`
3. Configure `appsscript.json` manifest
4. Enable required APIs in console
5. Test with sample shortcuts

## Support

For issues or questions, contact: support@tangentforge.com
