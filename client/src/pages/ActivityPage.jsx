import React, { useEffect, useState } from 'react';

function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [eventType, setEventType] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseMintedTokens = await fetch('http://localhost:5000/api/minted-tokens');
        const mintedTokens = await responseMintedTokens.json();

        const responseListings = await fetch('http://localhost:5000/api/listings');
        const listings = await responseListings.json();

        const responsePurchases = await fetch('http://localhost:5000/api/purchases');
        const purchases = await responsePurchases.json();

        const responseCancellations = await fetch('http://localhost:5000/api/cancellations');
        const cancellations = await responseCancellations.json();

        const responseAuctions = await fetch('http://localhost:5000/api/auctions');
        const auctions = await responseAuctions.json();

        const responseAuctionDeletions = await fetch('http://localhost:5000/api/auction-deletions');
        const auctionDeletions = await responseAuctionDeletions.json();

        const responseAuctionResults = await fetch('http://localhost:5000/api/auction-results');
        const auctionResults = await responseAuctionResults.json();

        const formatPriceToPOL = (wei) => {
          const POL = wei / 1e18;
          return POL.toFixed(4);
        };

        const allActivities = [
          ...mintedTokens.map(item => ({
            type: '[TokenMinted]',
            message: `Token ${item.token_id} minted by ${item.minter}`,
            timestamp: item.created_at,
          })),
          ...listings.map(item => ({
            type: '[ListingCreated]',
            message: `Listing ${item.listing_id} created by ${item.seller} for token ${item.token_id} at ${formatPriceToPOL(item.price)} POL`,
            timestamp: item.created_at,
          })),
          ...purchases.map(item => ({
            type: '[Purchase]',
            message: `Purchase made by ${item.buyer} for ${formatPriceToPOL(item.price)} POL from ${item.seller} (Listing ${item.listing_id})`,
            timestamp: item.created_at,
          })),
          ...cancellations.map(item => ({
            type: '[ListingCancelled]',
            message: `Listing ${item.listing_id} cancelled by ${item.seller}`,
            timestamp: item.created_at,
          })),
          ...auctions.map(item => ({
            type: '[AuctionCreated]',
            message: `Auction ${item.auction_id} created by ${item.creator} for token ${item.token_id} starting at ${item.start_time}`,
            timestamp: item.created_at,
          })),
          ...auctionDeletions.map(item => ({
            type: '[AuctionDeleted]',
            message: `Auction ${item.auction_id} deleted by ${item.creator} for token ${item.token_id}`,
            timestamp: item.deleted_at,
          })),
          ...auctionResults.map(item => ({
            type: '[AuctionResult]',
            message: `Auction ${item.auction_id} ended, winner: ${item.winner}, bid: ${formatPriceToPOL(item.highest_bid)} POL`,
            timestamp: item.recorded_at,
          })),
        ];

        allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setActivities(allActivities);
        setFilteredActivities(allActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchData();
  }, []);

  const handleEventTypeChange = (event) => {
    const type = event.target.value;
    setEventType(type);
    if (type === 'All') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter(activity => activity.type === type));
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', height: '100vh' }}>
      <h1>Marketplace Activity</h1>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="eventType" style={{ marginRight: '10px' }}>Filter by Event Type: </label>
        <select
          id="eventType"
          value={eventType}
          onChange={handleEventTypeChange}
          style={{
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            fontSize: '16px',
            backgroundColor: '#f0f8ff'
          }}
        >
          <option value="All">All</option>
          <option value="[TokenMinted]">TokenMinted</option>
          <option value="[ListingCreated]">ListingCreated</option>
          <option value="[Purchase]">Purchase</option>
          <option value="[ListingCancelled]">ListingCancelled</option>
          <option value="[AuctionCreated]">AuctionCreated</option>
          <option value="[AuctionDeleted]">AuctionDeleted</option>
          <option value="[AuctionResult]">AuctionResult</option>
        </select>
      </div>

      {filteredActivities.length === 0 ? (
        <h2>No event of such type has occurred yet...</h2>
      ) : (
        <div style={{ border: '1px solid #ccc', borderRadius: '6px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#1E90FF', color: 'white', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ padding: '10px', textAlign: 'left' }}>Event Type</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Message</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Timestamp</th>
              </tr>
            </thead>
          </table>
          <div style={{ height: '60vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {filteredActivities.map((activity, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{activity.type}</td>
                    <td style={{ padding: '10px' }}>{activity.message}</td>
                    <td style={{ padding: '10px' }}>{new Date(activity.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityPage;
