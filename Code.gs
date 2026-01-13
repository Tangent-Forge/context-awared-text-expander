/**
 * Context-Awared Text Expander
 * Google Workspace Add-on for smart text shortcuts
 */

const UI_LABEL = 'Context-Awared Text Expander';
const storageKey = 'textExpander_config';
const logKey = 'textExpander_logs';

// Add-on Lifecycle Functions
function onInstall(e) {
  onOpen(e);
}

function onOpen(e) {
  const ui = DocumentApp.getUi();
  ui.createMenu(UI_LABEL)
    .addItem('Open Expander', 'showSidebar')
    .addItem('Create Shortcut', 'createShortcut')
    .addItem('View Templates', 'viewTemplates')
    .addItem('Settings', 'showSettings')
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle(UI_LABEL)
    .setWidth(400);
  DocumentApp.getUi().showSidebar(html);
}

// API Functions for Sidebar
function getShortcuts() {
  const props = PropertiesService.getUserProperties();
  const shortcuts = props.getProperty('shortcuts');
  return shortcuts ? JSON.parse(shortcuts) : getDefaultShortcuts();
}

function createShortcut(shortcutData) {
  const shortcuts = getShortcuts();
  
  const newShortcut = {
    id: Utilities.getUuid(),
    abbreviation: shortcutData.abbreviation,
    expansion: shortcutData.expansion,
    category: shortcutData.category || 'General',
    context: shortcutData.context || [],
    variables: shortcutData.variables || [],
    conditions: shortcutData.conditions || [],
    createdAt: new Date().toISOString(),
    lastUsed: null,
    usageCount: 0
  };
  
  shortcuts.push(newShortcut);
  
  const props = PropertiesService.getUserProperties();
  props.setProperty('shortcuts', JSON.stringify(shortcuts));
  
  logActivity('shortcut_created', { 
    shortcutId: newShortcut.id,
    abbreviation: newShortcut.abbreviation
  });
  
  return { success: true, shortcut: newShortcut };
}

function updateShortcut(shortcutId, data) {
  const shortcuts = getShortcuts();
  const index = shortcuts.findIndex(s => s.id === shortcutId);
  
  if (index !== -1) {
    shortcuts[index] = { ...shortcuts[index], ...data };
    
    const props = PropertiesService.getUserProperties();
    props.setProperty('shortcuts', JSON.stringify(shortcuts));
    
    logActivity('shortcut_updated', { shortcutId: shortcutId });
    
    return { success: true, shortcut: shortcuts[index] };
  }
  
  return { success: false, error: 'Shortcut not found' };
}

function deleteShortcut(shortcutId) {
  const shortcuts = getShortcuts();
  const filtered = shortcuts.filter(s => s.id !== shortcutId);
  
  const props = PropertiesService.getUserProperties();
  props.setProperty('shortcuts', JSON.stringify(filtered));
  
  logActivity('shortcut_deleted', { shortcutId: shortcutId });
  
  return { success: true };
}

function expandShortcut(abbreviation, context) {
  const shortcuts = getShortcuts();
  const shortcut = shortcuts.find(s => s.abbreviation.toLowerCase() === abbreviation.toLowerCase());
  
  if (!shortcut) {
    return { success: false, error: 'Shortcut not found' };
  }
  
  // Resolve variables
  let expansion = shortcut.expansion;
  expansion = resolveVariables(expansion, context);
  
  // Update usage stats
  updateShortcutUsage(shortcut.id);
  
  logActivity('shortcut_expanded', { 
    shortcutId: shortcut.id,
    abbreviation: abbreviation
  });
  
  return { success: true, expansion: expansion, shortcut: shortcut };
}

function resolveVariables(text, context) {
  const now = new Date();
  
  // Built-in variables
  const variables = {
    '{date}': now.toLocaleDateString(),
    '{time}': now.toLocaleTimeString(),
    '{datetime}': now.toLocaleString(),
    '{year}': now.getFullYear(),
    '{month}': now.getMonth() + 1,
    '{day}': now.getDate(),
    '{user}': Session.getActiveUser().getEmail(),
    '{weekday}': now.toLocaleDateString('en-US', { weekday: 'long' }),
    '{month_name}': now.toLocaleDateString('en-US', { month: 'long' })
  };
  
  // Add custom variables from context
  if (context && context.variables) {
    Object.assign(variables, context.variables);
  }
  
  // Replace variables in text
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  
  return result;
}

function updateShortcutUsage(shortcutId) {
  const shortcuts = getShortcuts();
  const index = shortcuts.findIndex(s => s.id === shortcutId);
  
  if (index !== -1) {
    shortcuts[index].lastUsed = new Date().toISOString();
    shortcuts[index].usageCount = (shortcuts[index].usageCount || 0) + 1;
    
    const props = PropertiesService.getUserProperties();
    props.setProperty('shortcuts', JSON.stringify(shortcuts));
  }
}

function analyzeDocument() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody().getText();
  
  const context = {
    documentType: detectDocumentType(body),
    keywords: extractKeywords(body),
    intent: determineIntent(body),
    variables: {}
  };
  
  return context;
}

function detectDocumentType(content) {
  const lower = content.toLowerCase();
  
  if (lower.includes('dear') && lower.includes('sincerely')) {
    return 'email';
  } else if (lower.includes('function') || lower.includes('class') || lower.includes('import')) {
    return 'code';
  } else if (lower.includes('report') || lower.includes('analysis') || lower.includes('summary')) {
    return 'report';
  } else if (lower.includes('meeting') || lower.includes('agenda') || lower.includes('minutes')) {
    return 'meeting';
  } else {
    return 'general';
  }
}

function extractKeywords(content) {
  const words = content.split(/\s+/);
  const keywords = [];
  
  // Extract common words
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length > 3 && !commonWords.includes(cleanWord)) {
      if (!keywords.includes(cleanWord)) {
        keywords.push(cleanWord);
      }
    }
  });
  
  return keywords.slice(0, 10); // Return top 10 keywords
}

function determineIntent(content) {
  const lower = content.toLowerCase();
  
  if (lower.includes('thank') || lower.includes('appreciate')) {
    return 'gratitude';
  } else if (lower.includes('sorry') || lower.includes('apologize')) {
    return 'apology';
  } else if (lower.includes('please') || lower.includes('request')) {
    return 'request';
  } else if (lower.includes('question') || lower.includes('?')) {
    return 'inquiry';
  } else {
    return 'general';
  }
}

function getTemplates() {
  const props = PropertiesService.getUserProperties();
  const templates = props.getProperty('templates');
  return templates ? JSON.parse(templates) : getDefaultTemplates();
}

function createTemplate(templateData) {
  const templates = getTemplates();
  
  const newTemplate = {
    id: Utilities.getUuid(),
    name: templateData.name,
    content: templateData.content,
    category: templateData.category || 'General',
    variables: templateData.variables || [],
    createdAt: new Date().toISOString()
  };
  
  templates.push(newTemplate);
  
  const props = PropertiesService.getUserProperties();
  props.setProperty('templates', JSON.stringify(templates));
  
  logActivity('template_created', { 
    templateId: newTemplate.id,
    name: newTemplate.name
  });
  
  return { success: true, template: newTemplate };
}

function applyTemplate(templateId, context) {
  const templates = getTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    return { success: false, error: 'Template not found' };
  }
  
  let content = template.content;
  content = resolveVariables(content, context);
  
  logActivity('template_applied', { 
    templateId: templateId,
    name: template.name
  });
  
  return { success: true, content: content, template: template };
}

function createShortcut() {
  showSidebar();
}

function viewTemplates() {
  showSidebar();
}

function showSettings() {
  showSidebar();
}

// Shortcut Engine Module
const ShortcutEngine = {
  expandShortcut: function(abbreviation, context) {
    return expandShortcut(abbreviation, context);
  },

  parseVariables: function(text, context) {
    return resolveVariables(text, context);
  },

  applyConditions: function(shortcut, context) {
    // Placeholder for conditional logic
    return true;
  },

  validateShortcut: function(shortcut) {
    if (!shortcut.abbreviation || !shortcut.expansion) {
      return { valid: false, error: 'Abbreviation and expansion are required' };
    }
    return { valid: true };
  }
};

// Context Analyzer Module
const ContextAnalyzer = {
  analyzeDocument: function() {
    return analyzeDocument();
  },

  detectDocumentType: function(content) {
    return detectDocumentType(content);
  },

  extractKeywords: function(content) {
    return extractKeywords(content);
  },

  determineIntent: function(content) {
    return determineIntent(content);
  }
};

// Variable Resolver Module
const VariableResolver = {
  resolveVariable: function(variable, context) {
    return resolveVariables(variable, context);
  },

  formatDate: function(format) {
    const now = new Date();
    return now.toLocaleDateString();
  },

  formatTime: function(format) {
    const now = new Date();
    return now.toLocaleTimeString();
  },

  getCustomVariables: function() {
    const config = getConfig();
    return config.customVariables || {};
  }
};

// Template Manager Module
const TemplateManager = {
  createTemplate: function(name, content) {
    return createTemplate({ name, content });
  },

  applyTemplate: function(templateId, context) {
    return applyTemplate(templateId, context);
  },

  listTemplates: function() {
    return getTemplates();
  },

  deleteTemplate: function(templateId) {
    const templates = getTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    
    const props = PropertiesService.getUserProperties();
    props.setProperty('templates', JSON.stringify(filtered));
    
    return { success: true };
  }
};

// Sync Engine Module
const SyncEngine = {
  syncShortcuts: function(shortcuts) {
    const props = PropertiesService.getUserProperties();
    props.setProperty('shortcuts', JSON.stringify(shortcuts));
    return { success: true };
  },

  exportShortcuts: function() {
    const shortcuts = getShortcuts();
    return JSON.stringify(shortcuts, null, 2);
  },

  importShortcuts: function(data) {
    try {
      const shortcuts = JSON.parse(data);
      const props = PropertiesService.getUserProperties();
      props.setProperty('shortcuts', JSON.stringify(shortcuts));
      return { success: true, imported: shortcuts.length };
    } catch (e) {
      return { success: false, error: 'Invalid data format' };
    }
  },

  getSyncStatus: function() {
    return { synced: true, lastSync: new Date().toISOString() };
  }
};

// Analytics Tracker Module
const AnalyticsTracker = {
  trackUsage: function(shortcutId) {
    updateShortcutUsage(shortcutId);
    return { success: true };
  },

  getUsageStats: function() {
    const shortcuts = getShortcuts();
    return {
      totalShortcuts: shortcuts.length,
      totalUsage: shortcuts.reduce((sum, s) => sum + (s.usageCount || 0), 0),
      mostUsed: shortcuts.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0],
      recentlyUsed: shortcuts.filter(s => s.lastUsed).sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed)).slice(0, 5)
    };
  },

  getPopularShortcuts: function() {
    const shortcuts = getShortcuts();
    return shortcuts.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, 10);
  },

  generateReport: function() {
    const stats = this.getUsageStats();
    return {
      summary: {
        totalShortcuts: stats.totalShortcuts,
        totalUsage: stats.totalUsage,
        topShortcut: stats.mostUsed?.abbreviation || 'N/A'
      },
      shortcuts: getShortcuts(),
      generatedAt: new Date().toISOString()
    };
  }
};

// Helper Functions
function getConfig() {
  const props = PropertiesService.getUserProperties();
  const config = props.getProperty(storageKey);
  return config ? JSON.parse(config) : { customVariables: {} };
}

function saveConfig(config) {
  const props = PropertiesService.getUserProperties();
  props.setProperty(storageKey, JSON.stringify(config));
}

function getDefaultShortcuts() {
  return [
    {
      id: 'default-1',
      abbreviation: 'ty',
      expansion: 'Thank you for your message. I will review and respond shortly.',
      category: 'General',
      context: [],
      variables: [],
      conditions: [],
      createdAt: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0
    },
    {
      id: 'default-2',
      abbreviation: 'sig',
      expansion: 'Best regards,\n{user}',
      category: 'General',
      context: [],
      variables: ['{user}'],
      conditions: [],
      createdAt: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0
    },
    {
      id: 'default-3',
      abbreviation: 'mtg',
      expansion: 'Meeting Date: {date}\nTime: {time}\nAgenda:\n- \n- \n- ',
      category: 'Meeting',
      context: [],
      variables: ['{date}', '{time}'],
      conditions: [],
      createdAt: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0
    }
  ];
}

function getDefaultTemplates() {
  return [
    {
      id: 'template-1',
      name: 'Email Response',
      content: 'Dear {name},\n\nThank you for your email regarding {subject}.\n\nI will review the information and get back to you by {date}.\n\nBest regards,\n{user}',
      category: 'Email',
      variables: ['{name}', '{subject}', '{date}', '{user}'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'template-2',
      name: 'Meeting Notes',
      content: 'Meeting: {meeting_name}\nDate: {date}\nTime: {time}\nAttendees: \n\nAgenda:\n- \n\nDiscussion:\n\nAction Items:\n- ',
      category: 'Meeting',
      variables: ['{meeting_name}', '{date}', '{time}'],
      createdAt: new Date().toISOString()
    }
  ];
}

function logActivity(action, details) {
  const props = PropertiesService.getUserProperties();
  const logs = JSON.parse(props.getProperty(logKey) || '[]');
  logs.unshift({
    timestamp: new Date().toISOString(),
    action: action,
    details: details
  });
  if (logs.length > 100) {
    logs.pop();
  }
  props.setProperty(logKey, JSON.stringify(logs));
}

function getActivityLog() {
  const props = PropertiesService.getUserProperties();
  return JSON.parse(props.getProperty(logKey) || '[]');
}
