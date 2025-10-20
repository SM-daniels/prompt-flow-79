# Migration 007: Media Storage

## Overview
Creates Supabase Storage bucket for chat media (images, audio, video, documents) with organization-level RLS policies.

## SQL Migration

```sql
-- Create storage bucket for messages media
insert into storage.buckets (id, name, public)
values ('messages-media', 'messages-media', true);

-- RLS Policy: Allow authenticated users to upload to their organization's folder
create policy "Users can upload media to their organization"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'messages-media' AND
  (storage.foldername(name))[1] IN (
    select organization_id::text
    from users_organizations
    where user_id = auth.uid()
  )
);

-- RLS Policy: Allow authenticated users to read media from their organization
create policy "Users can view their organization's media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'messages-media' AND
  (storage.foldername(name))[1] IN (
    select organization_id::text
    from users_organizations
    where user_id = auth.uid()
  )
);

-- RLS Policy: Allow authenticated users to delete their organization's media
create policy "Users can delete their organization's media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'messages-media' AND
  (storage.foldername(name))[1] IN (
    select organization_id::text
    from users_organizations
    where user_id = auth.uid()
  )
);
```

## Folder Structure
Files are organized as: `{organization_id}/{message_id}/{filename}`

Example: `550e8400-e29b-41d4-a716-446655440000/msg-123/image.jpg`

## Supported Media Types
- **Images**: image/jpeg, image/png, image/gif, image/webp (max 10MB)
- **Audio**: audio/mpeg, audio/wav, audio/ogg (max 50MB)
- **Video**: video/mp4, video/webm (max 50MB)
- **Documents**: application/pdf (max 20MB)

## Usage
Use the `mediaUpload.ts` utility functions to interact with this storage bucket.
