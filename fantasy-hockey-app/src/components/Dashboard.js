import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchUserData() {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
      setLoading(false);
    }
    fetchUserData();
  }, [currentUser]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      {userData && (
        <div className="user-stats">
          <h2>Welcome, {userData.username}!</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Winnings</h3>
              <p>${userData.totalWinnings}</p>
            </div>
            <div className="stat-card">
              <h3>Contests Entered</h3>
              <p>{userData.contestsEntered}</p>
            </div>
            <div className="stat-card">
              <h3>Contests Won</h3>
              <p>{userData.contestsWon}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 