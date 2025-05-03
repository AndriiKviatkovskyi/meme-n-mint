import React, { useState, useEffect } from 'react';

function StatsPage() {
  const [totalMinted, setTotalMinted] = useState(null);
  const [totalSold, setTotalSold] = useState(null);
  const [totalAuctionsEnded, setTotalAuctionsEnded] = useState(null);
  const [totalLikes, setTotalLikes] = useState(null);
  const [totalRaised, setTotalRaised] = useState(null);

  useEffect(() => {
    const fetchTotalMinted = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/total-minted');
        const data = await response.json();
        setTotalMinted(data.totalMinted);
      } catch (error) {
        console.error('Error fetching total minted:', error);
      }
    };

    const fetchTotalSold = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/total-sold');
        const data = await response.json();
        setTotalSold(data.totalSold);
      } catch (error) {
        console.error('Error fetching total sold:', error);
      }
    };

    const fetchTotalAuctionsEnded = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/total-auctions-ended');
        const data = await response.json();
        setTotalAuctionsEnded(data.totalAuctionsEnded);
      } catch (error) {
        console.error('Error fetching total auctions ended:', error);
      }
    };

    const fetchTotalLikes = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/likes/count');
        const data = await response.json();
        setTotalLikes(data.total_likes);
      } catch (error) {
        console.error('Error fetching total likes:', error);
      }
    };

    const fetchTotalRaised = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/total-raised');
        const data = await response.json();
        console.log(data);
        setTotalRaised(data.totalPolDividedBy10);
      } catch (error) {
        console.error('Error fetching total raised funds:', error);
      }
    };

    fetchTotalMinted();
    fetchTotalSold();
    fetchTotalAuctionsEnded();
    fetchTotalLikes();
    fetchTotalRaised();
  }, []);

  return (
    <div style={{ padding: '30px', backgroundColor: '#f1f8ff', borderRadius: '10px', overflowY: 'auto', maxHeight: '100vh' }}>
      <h1 style={{ color: '#1e3a8a', fontSize: '2.5em', textAlign: 'center' }}>Marketplace Statistics</h1>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#e0f2fe', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ color: '#1e3a8a', textAlign: 'center' }}>NFT Statistics</h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <div style={{ textAlign: 'center', backgroundColor: '#b3d9ff', padding: '20px', borderRadius: '10px', width: '22%', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ color: '#1e3a8a' }}>Total NFTs Minted</h3>
            <p style={{ fontSize: '1.5em', color: '#1e3a8a' }}>{totalMinted !== null ? totalMinted : 'Loading...'}</p>
          </div>

          <div style={{ textAlign: 'center', backgroundColor: '#b3d9ff', padding: '20px', borderRadius: '10px', width: '22%', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ color: '#1e3a8a' }}>Total NFTs Sold</h3>
            <p style={{ fontSize: '1.5em', color: '#1e3a8a' }}>{totalSold !== null ? totalSold : 'Loading...'}</p>
          </div>

          <div style={{ textAlign: 'center', backgroundColor: '#b3d9ff', padding: '20px', borderRadius: '10px', width: '22%', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ color: '#1e3a8a' }}>Total Auctions Ended</h3>
            <p style={{ fontSize: '1.5em', color: '#1e3a8a' }}>{totalAuctionsEnded !== null ? totalAuctionsEnded : 'Loading...'}</p>
          </div>

          <div style={{ textAlign: 'center', backgroundColor: '#b3d9ff', padding: '20px', borderRadius: '10px', width: '22%', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ color: '#1e3a8a' }}>Total Likes</h3>
            <p style={{ fontSize: '1.5em', color: '#1e3a8a' }}>{totalLikes !== null ? totalLikes : 'Loading...'}</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '40px', backgroundColor: '#b3d9ff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <h2 style={{ color: '#1e3a8a' }}>TOTAL FUNDS RAISED</h2>
        <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#1e3a8a' }}>
          {totalRaised !== null ? `${totalRaised} POL` : 'Loading...'}
        </p>
      </div>
    </div>
  );
}

export default StatsPage;
