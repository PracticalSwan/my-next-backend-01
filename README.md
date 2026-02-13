# hello-api

Next.js API backend for week 9 assignment.

## Setup

```bash
npm install
npm run dev
```

Default URL: http://localhost:3000

## Profile Management APIs

All profile endpoints require authentication via HTTP-only cookie token.

- `GET /api/user/profile`
	- Returns user profile fields: `_id`, `firstname`, `lastname`, `email`, `profileImage`.

- `PATCH /api/user/profile`
	- Updates profile name fields (`firstname`, `lastname`).

- `POST /api/user/profile/image`
	- Accepts `multipart/form-data` with field name `file`.
	- Allows only image MIME types: JPEG, PNG, GIF, WebP.
	- Stores files in `public/profile-images/` with unguessable generated filenames.
	- Saves image path in user profile as `/profile-images/<filename>`.

- `DELETE /api/user/profile/image`
	- Removes current profile image file and clears `profileImage` in database.

## Notes

- Uploaded images are publicly accessible via `/profile-images/<filename>`.
- File content is stored on backend disk; only file path is stored in MongoDB.
