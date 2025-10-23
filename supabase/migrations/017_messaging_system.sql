-- Internal Messaging System
-- Simplified version without real-time subscriptions

-- Channels (group conversations)
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('public', 'private', 'team')) DEFAULT 'public',
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel Members
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(channel_id, user_id)
);

-- Direct Messages (1-on-1 conversations)
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  participant_2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id),
  CHECK (participant_1_id < participant_2_id)
);

-- Messages (unified for DMs and channels)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Polymorphic relationship
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  dm_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,

  -- Threading
  parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  thread_reply_count INTEGER DEFAULT 0,

  -- Rich content
  mentions UUID[], -- Array of user IDs mentioned
  attachments JSONB, -- [{type, url, name, size}]

  -- Status
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (
    (channel_id IS NOT NULL AND dm_id IS NULL) OR
    (channel_id IS NULL AND dm_id IS NOT NULL)
  )
);

-- Message Reactions
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Message Read Receipts
CREATE TABLE message_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- User Presence
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('online', 'away', 'dnd', 'offline')) DEFAULT 'offline',
  custom_status TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_channel_id ON messages(channel_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_messages_dm_id ON messages(dm_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_parent_id ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX idx_dm_participants_1 ON direct_messages(participant_1_id);
CREATE INDEX idx_dm_participants_2 ON direct_messages(participant_2_id);
CREATE INDEX idx_messages_mentions ON messages USING GIN(mentions);
CREATE INDEX idx_channels_type ON channels(type) WHERE is_archived = false;
CREATE INDEX idx_channels_team_id ON channels(team_id) WHERE team_id IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON direct_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON user_presence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last_message_at when new message is created
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.channel_id IS NOT NULL THEN
    UPDATE channels
    SET last_message_at = NEW.created_at
    WHERE id = NEW.channel_id;
  ELSIF NEW.dm_id IS NOT NULL THEN
    UPDATE direct_messages
    SET last_message_at = NEW.created_at
    WHERE id = NEW.dm_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Update thread reply count
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    UPDATE messages
    SET thread_reply_count = thread_reply_count + 1
    WHERE id = NEW.parent_message_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_count_on_reply
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- Create default "General" channel
INSERT INTO channels (name, description, type, created_by)
VALUES (
  'General',
  'Company-wide announcements and general discussion',
  'public',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- Add all users to General channel
INSERT INTO channel_members (channel_id, user_id, role)
SELECT
  (SELECT id FROM channels WHERE name = 'General' LIMIT 1),
  id,
  CASE WHEN role = 'admin' THEN 'owner' ELSE 'member' END
FROM users;
