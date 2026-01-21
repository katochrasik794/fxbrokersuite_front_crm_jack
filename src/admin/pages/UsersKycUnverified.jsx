// src/pages/admin/UsersKycUnverified.jsx
import UsersAll from './UsersAll.jsx';

export default function UsersKycUnverified() {
  return <UsersAll initialTitle="KYC Unverified Users" queryParams={{ kycStatus: 'unverified' }} />;
}

