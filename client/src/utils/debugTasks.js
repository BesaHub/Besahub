// Debug script to be injected into the browser console
const setupAuth = () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTk4NDAyODksImV4cCI6MTc1OTg0MTE4OX0.x0USwLTPrmzPMh5wCbPaxkHimaQvcdLwNUYutLDHVb0';
  const user = {
    id: "00000000-0000-0000-0000-000000000001",
    firstName: "Demo",
    lastName: "Admin",
    email: "admin@demo.com",
    role: "admin",
    isActive: true
  };
  
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  console.log('✅ Authentication set successfully!');
  console.log('Navigating to Tasks page...');
  
  window.location.href = '/tasks';
};

// Run this in browser console
// setupAuth();