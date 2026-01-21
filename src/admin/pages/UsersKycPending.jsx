// src/pages/admin/UsersKycPending.jsx
import UsersAll from './UsersAll.jsx';

export default function UsersKycPending() {
  return <UsersAll initialTitle="KYC Pending Users" queryParams={{ kycStatus: 'pending' }} />;
}

