# Supabase Integration Plan for NGOG ToDo Tracker

## Overview
This plan outlines the complete integration of Supabase into the NGOG ToDo Tracker to enable real-time syncing across devices while maintaining offline functionality and data privacy.

## Phase 1: Database Schema Design

### 1.1 Core Tables Structure

#### Users Table (Built-in Supabase Auth)
- Uses Supabase's built-in `auth.users` table
- No custom user table needed initially

#### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('open', 'completed')) DEFAULT 'open',
  categories UUID[] DEFAULT '{}',
  notes TEXT,
  checklist JSONB DEFAULT '[]',
  linked_project UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  local_id TEXT -- For offline sync mapping
);
```

#### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  predefined BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);
```

#### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('idea', 'preparation', 'active', 'waiting', 'completed', 'on_hold')) DEFAULT 'idea',
  color TEXT DEFAULT '#3B82F6',
  participants JSONB DEFAULT '[]',
  linked_tasks UUID[] DEFAULT '{}',
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);
```

#### Project Activity Logs Table
```sql
CREATE TABLE project_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  auto BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  timestamp TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);
```

#### Activity Log Categories Table
```sql
CREATE TABLE activity_log_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  predefined BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);
```

#### Events Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  participation_type TEXT CHECK (participation_type IN ('exhibitor', 'speaker', 'exhibitor_speaker')) DEFAULT 'exhibitor',
  talk_title TEXT,
  talk_date DATE,
  talk_time TIME,
  participants JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);
```

#### User Settings Table
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'default',
  notifications BOOLEAN DEFAULT true,
  password_hash TEXT, -- For app-level password if needed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 Row Level Security (RLS) Policies

All tables will have RLS enabled with policies ensuring users can only access their own data:

```sql
-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Example policy for tasks (similar for all tables)
CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);
```

### 1.3 Database Functions and Triggers

#### Auto-update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Phase 2: Authentication Integration

### 2.1 Supabase Client Setup
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 2.2 Authentication Context
```javascript
// src/contexts/AuthContext.jsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Handle auth state changes
  // Provide login, logout, signup functions
}
```

### 2.3 Migration from Password Protection
- Replace current password protection with Supabase Auth
- Support email/password authentication
- Optional: Add social login (Google, GitHub)
- Maintain session persistence

## Phase 3: Data Layer Refactoring

### 3.1 Database Service Layer
```javascript
// src/services/database.js
class DatabaseService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient
  }
  
  // Generic CRUD operations
  async create(table, data) { /* ... */ }
  async read(table, filters) { /* ... */ }
  async update(table, id, data) { /* ... */ }
  async delete(table, id) { /* ... */ }
  
  // Real-time subscriptions
  subscribe(table, callback) { /* ... */ }
}
```

### 3.2 Offline-First Architecture
```javascript
// src/services/syncService.js
class SyncService {
  constructor(databaseService) {
    this.db = databaseService
    this.offlineQueue = []
    this.isOnline = navigator.onLine
  }
  
  // Queue operations when offline
  async queueOperation(operation) { /* ... */ }
  
  // Sync when back online
  async syncPendingOperations() { /* ... */ }
  
  // Handle conflicts
  async resolveConflicts(localData, remoteData) { /* ... */ }
}
```

### 3.3 Context Updates
Each context (TaskContext, ProjectContext, etc.) will be updated to:
- Use Supabase for data operations
- Maintain localStorage as offline cache
- Handle real-time updates
- Queue operations when offline

## Phase 4: Real-time Synchronization

### 4.1 Real-time Subscriptions
```javascript
// Subscribe to changes for each data type
const subscription = supabase
  .channel('tasks_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'tasks' },
    handleTaskChange
  )
  .subscribe()
```

### 4.2 Conflict Resolution Strategy
- **Last Write Wins**: Simple approach for most cases
- **Field-level merging**: For complex objects like checklists
- **User prompt**: For critical conflicts
- **Timestamp-based**: Use updated_at for resolution

### 4.3 Optimistic Updates
- Update UI immediately
- Sync to server in background
- Rollback on failure
- Show sync status indicators

## Phase 5: Migration Strategy

### 5.1 Data Migration Tool
```javascript
// src/utils/migration.js
class DataMigrator {
  async migrateFromLocalStorage() {
    // Read existing localStorage data
    // Transform to Supabase schema
    // Upload to Supabase
    // Verify migration success
    // Clear localStorage (optional)
  }
  
  async createInitialData(userId) {
    // Create default categories
    // Create default activity log categories
    // Set up user preferences
  }
}
```

### 5.2 Migration UI
- Migration wizard for existing users
- Progress indicators
- Backup creation before migration
- Rollback option if needed

### 5.3 Backward Compatibility
- Detect if user has existing localStorage data
- Offer migration on first Supabase login
- Maintain localStorage fallback during transition

## Phase 6: Enhanced Features

### 6.1 Advanced Sync Features
- **Selective sync**: Choose what to sync across devices
- **Sync status indicators**: Show sync progress
- **Offline indicators**: Clear offline/online status
- **Conflict resolution UI**: Let users resolve conflicts

### 6.2 Collaboration Features (Future)
- **Project sharing**: Share projects with other users
- **Real-time collaboration**: Multiple users editing
- **Activity feeds**: See what others are doing
- **Permissions**: Read-only vs edit access

### 6.3 Data Export/Import Enhancement
- **Cloud backups**: Automatic backups to user's cloud storage
- **Cross-platform export**: Export for other todo apps
- **Scheduled exports**: Regular backup reminders
- **Version history**: Keep track of data changes

## Phase 7: Implementation Timeline

### Week 1-2: Database Setup
- [ ] Create Supabase project
- [ ] Set up database schema
- [ ] Configure RLS policies
- [ ] Create database functions/triggers

### Week 3-4: Authentication
- [ ] Implement Supabase Auth
- [ ] Create AuthContext
- [ ] Replace password protection
- [ ] Add login/signup UI

### Week 5-6: Data Layer
- [ ] Create database service layer
- [ ] Implement sync service
- [ ] Update contexts for Supabase
- [ ] Add offline queue system

### Week 7-8: Real-time Features
- [ ] Implement real-time subscriptions
- [ ] Add conflict resolution
- [ ] Create sync status indicators
- [ ] Test offline/online scenarios

### Week 9-10: Migration & Polish
- [ ] Build migration tool
- [ ] Create migration UI
- [ ] Add enhanced export/import
- [ ] Performance optimization
- [ ] Testing and bug fixes

## Phase 8: Testing Strategy

### 8.1 Test Scenarios
- **Offline/Online transitions**
- **Multiple device sync**
- **Conflict resolution**
- **Data migration**
- **Performance with large datasets**

### 8.2 Test Data
- Create test datasets of various sizes
- Test with different user scenarios
- Stress test real-time updates
- Test migration from localStorage

## Phase 9: Deployment Considerations

### 9.1 Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 9.2 Build Configuration
- Update Vite config for Supabase
- Configure environment variables
- Set up deployment pipeline
- Add health checks

### 9.3 Monitoring
- Set up error tracking
- Monitor sync performance
- Track user adoption
- Database performance monitoring

## Phase 10: Documentation & Training

### 10.1 User Documentation
- Migration guide for existing users
- New user onboarding
- Sync troubleshooting
- Privacy and data handling

### 10.2 Developer Documentation
- API documentation
- Database schema docs
- Deployment guide
- Troubleshooting guide

## Risk Mitigation

### Technical Risks
- **Data loss during migration**: Comprehensive backup strategy
- **Sync conflicts**: Robust conflict resolution
- **Performance issues**: Optimize queries and caching
- **Offline functionality**: Extensive offline testing

### User Experience Risks
- **Complex migration**: Simple, guided migration process
- **Learning curve**: Maintain familiar UI/UX
- **Sync confusion**: Clear status indicators
- **Privacy concerns**: Transparent data handling

## Success Metrics

### Technical Metrics
- Migration success rate > 95%
- Sync latency < 2 seconds
- Offline functionality 100% maintained
- Zero data loss incidents

### User Experience Metrics
- User adoption of sync features > 80%
- Support tickets related to sync < 5%
- User satisfaction with sync > 4.5/5
- Retention rate improvement

## Conclusion

This integration plan provides a comprehensive roadmap for adding Supabase to your NGOG ToDo Tracker while maintaining the excellent offline-first experience you've built. The phased approach ensures minimal disruption to existing users while adding powerful sync capabilities.

The key principles throughout this integration:
1. **Offline-first**: Never compromise offline functionality
2. **Data safety**: Multiple backup and recovery mechanisms
3. **User control**: Users decide what and when to sync
4. **Privacy**: Strong RLS policies and data encryption
5. **Performance**: Optimistic updates and efficient sync

Would you like me to start implementing any specific phase of this plan?