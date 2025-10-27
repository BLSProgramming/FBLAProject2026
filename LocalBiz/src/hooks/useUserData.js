import { useState, useEffect } from 'react';

export default function useUserData() {
  const [userType, setUserType] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserData = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          return {
            userType: userData?.userType ?? userData?.type ?? localStorage.getItem('userType'),
            userId: userData?.id ?? userData?.userId ?? localStorage.getItem('userId')
          };
        }
      } catch (error) {
        console.debug('useUserData: failed to parse user object', error);
      }
      return {
        userType: localStorage.getItem('userType'),
        userId: localStorage.getItem('userId')
      };
    };

    const { userType, userId } = getUserData();
    setUserType(userType?.toLowerCase() || null);
    setUserId(userId ? Number(userId) : null);
  }, []);

  return { userType, userId };
}