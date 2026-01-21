// src/pages/admin/UsersBanned.jsx
import UsersAll from './UsersAll.jsx';

export default function UsersBanned() {
  return <UsersAll initialTitle="Banned Users" queryParams={{ status: 'banned' }} />;
}

