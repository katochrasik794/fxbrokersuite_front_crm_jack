// src/pages/admin/UsersActive.jsx
import UsersAll from './UsersAll.jsx';

export default function UsersActive() {
  return <UsersAll initialTitle="Active Users" queryParams={{ status: 'active' }} />;
}

