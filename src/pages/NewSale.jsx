import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// New Sale is now handled via the full Billing page
export default function NewSale() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/billing', { replace: true }); }, []);
  return null;
}
