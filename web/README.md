## Auth & Session Handling

The web app does **not** store access/refresh tokens in `localStorage` or JS-accessible storage.

- The backend issues **HttpOnly, Secure cookies** (`v8id_access_token`, `v8id_refresh_token`) after a successful login.
- The browser sends these cookies automatically on API calls to the backend; the frontend does not touch the raw tokens.
- Axios is configured with `withCredentials: true` so cookies are included on requests.

### Auth State Hydration

- On app startup, `StoreProvider` calls `GET /api/users/me/profile` to determine if the user is authenticated.
- If successful, the returned user object is stored in the Redux `auth` slice and `isAuthenticated` is set to `true`.
- Logout triggers the backend `/api/auth/logout` endpoint and then clears the local auth state (user and flags).

### CSRF

- The backend issues a non-HttpOnly `v8id_csrf_token` cookie and mirrors the same value in an `x-csrf-token` response header.
- For `POST/PUT/PATCH/DELETE` calls, the frontend must send the CSRF token in the `X-CSRF-Token` header to avoid `403 CSRF_TOKEN_INVALID` errors.
