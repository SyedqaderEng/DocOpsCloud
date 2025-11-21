# Phase 4 → Phase 5 Handoff Document
## Collaboration & Teams → Integrations

---

## Meta Information
| Field | Value |
|-------|-------|
| Phase | 4 - Collaboration & Teams |
| Duration | Weeks 25-32 |
| Handoff Date | ___________ |

---

## 1. Completed Deliverables

### Team Infrastructure
- [ ] Multi-tenant data model
- [ ] Team CRUD operations
- [ ] Role-based access control (RBAC)
- [ ] Team billing setup
- [ ] Invitation system (email + link)
- [ ] Team switching UI

### Real-Time Collaboration
- [ ] WebSocket server (Socket.io)
- [ ] Presence indicators
- [ ] Collaborative editing (Yjs CRDT)
- [ ] Live cursors
- [ ] Change synchronization
- [ ] Conflict resolution

### Comments & Annotations
- [ ] Threaded comments
- [ ] @mentions with notifications
- [ ] Reactions (emoji)
- [ ] Comment resolution
- [ ] Drawing annotations
- [ ] Highlight markup

### Team Management
- [ ] Team dashboard
- [ ] Team analytics
- [ ] Shared templates
- [ ] Team workflows
- [ ] Activity feed
- [ ] Member management

---

## 2. RBAC Model

### Roles & Permissions
| Permission | Owner | Admin | Member | Guest |
|------------|-------|-------|--------|-------|
| View documents | ✅ | ✅ | ✅ | ✅ |
| Edit documents | ✅ | ✅ | ✅ | ❌ |
| Delete documents | ✅ | ✅ | Own only | ❌ |
| Share externally | ✅ | ✅ | ❌ | ❌ |
| Manage members | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |
| Create workflows | ✅ | ✅ | ✅ | ❌ |
| Team workflows | ✅ | ✅ | View | ❌ |
| View analytics | ✅ | ✅ | Own | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |

---

## 3. Database Schema

```prisma
model Team {
  id           String       @id @default(cuid())
  name         String
  slug         String       @unique
  ownerId      String
  logo         String?
  settings     Json         @default("{}")
  members      TeamMember[]
  folders      Folder[]
  workflows    Workflow[]
  invitations  TeamInvite[]
  subscription Subscription?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@index([ownerId])
}

model TeamMember {
  id          String   @id @default(cuid())
  teamId      String
  userId      String
  role        TeamRole
  permissions Json?    // Custom permissions override
  team        Team     @relation(fields: [teamId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  joinedAt    DateTime @default(now())

  @@unique([teamId, userId])
}

enum TeamRole {
  OWNER
  ADMIN
  MEMBER
  GUEST
}

model TeamInvite {
  id        String   @id @default(cuid())
  teamId    String
  email     String
  role      TeamRole
  token     String   @unique
  expiresAt DateTime
  team      Team     @relation(fields: [teamId], references: [id])

  @@index([token])
  @@index([email])
}

model Comment {
  id         String    @id @default(cuid())
  documentId String
  userId     String
  content    String
  position   Json?     // For annotations
  parentId   String?   // For threads
  resolved   Boolean   @default(false)
  reactions  Json      @default("[]")
  mentions   String[]
  parent     Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies    Comment[] @relation("CommentReplies")
  user       User      @relation(fields: [userId], references: [id])
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([documentId])
  @@index([parentId])
}
```

---

## 4. WebSocket Architecture

```
Client                    Server                    Redis
  │                         │                         │
  │──── connect ───────────▶│                         │
  │                         │──── subscribe ─────────▶│
  │◀─── presence ───────────│◀─── pub/sub ───────────│
  │                         │                         │
  │──── cursor_move ───────▶│──── broadcast ─────────▶│
  │◀─── cursor_update ──────│◀─── broadcast ─────────│
  │                         │                         │
  │──── edit ──────────────▶│──── Yjs sync ──────────▶│
  │◀─── sync ───────────────│◀─── Yjs sync ──────────│
```

### WebSocket Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `connect` | C→S | `{ documentId, userId }` |
| `disconnect` | C→S | - |
| `presence` | S→C | `{ users: [] }` |
| `cursor:move` | C→S | `{ position, selection }` |
| `cursor:update` | S→C | `{ userId, position }` |
| `doc:edit` | C→S | `{ delta }` (Yjs) |
| `doc:sync` | S→C | `{ state }` (Yjs) |
| `comment:add` | C→S | `{ content, position }` |
| `comment:notify` | S→C | `{ comment }` |

---

## 5. Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| WebSocket latency | < 50ms | ___ms |
| Sync delay | < 100ms | ___ms |
| Max concurrent editors | 50 | ___ |
| Comment load time | < 500ms | ___ms |

---

## 6. Recommendations for Phase 5

### Integrations with Teams
1. Team-level integration connections
2. Shared integration credentials
3. Integration access per role

### OAuth Considerations
1. Team admins should manage OAuth connections
2. Token storage needs team-level encryption
3. Audit logging for integration access

---

## 7. Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
