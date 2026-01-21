// src/pages/admin/UsersEmailUnverified.jsx
import UsersAll from './UsersAll.jsx';

export default function UsersEmailUnverified() {
  return <UsersAll initialTitle="Email Unverified Users" queryParams={{ emailVerified: false }} />;
}

