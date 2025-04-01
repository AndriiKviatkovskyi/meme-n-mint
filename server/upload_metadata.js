import { create } from 'ipfs-http-client';
const ipfsClient = { create };
import fs from 'node:fs/promises';

const IPFS_GATEWAY = 'http://127.0.0.1:5001';

async function createMetadata(name, description, imageIpfsCid = null, otherAttributes = null) {
  const metadata = {
    name: name,
    description: description,
  };
  if (imageIpfsCid) {
    metadata.image = `ipfs://${imageIpfsCid}`;
  }
  if (otherAttributes) {
    metadata.attributes = otherAttributes;
  }
  return metadata;
}

async function uploadToIPFS(metadata) {
  try {
    const ipfs = ipfsClient.create({ url: IPFS_GATEWAY });
    const result = await ipfs.add(JSON.stringify(metadata));
    const cid = result.cid.toString();
    console.log(`Metadata uploaded to IPFS with CID: ${cid}`);
    return cid;
  } catch (error) {
    console.error(`Error uploading to IPFS: ${error}`);
    return null;
  }
}

async function main() {

  const nftName = 'My Awesome NFT';
  const nftDescription = 'This is a unique and amazing NFT.';

  const imageCid = 'QmYourImageCIDHere'; 

  const nftAttributes = [
    { trait_type: 'Rarity', value: 'Unique' },
    { trait_type: 'Artist', value: 'Your Name' },
  ];

  const metadata = await createMetadata(
    nftName,
    nftDescription,
    imageCid,
    nftAttributes
  );

  console.log('Generated Metadata:');
  console.log(JSON.stringify(metadata, null, 2));

  try {
    await fs.writeFile('nft_metadata.json', JSON.stringify(metadata, null, 2));
    console.log('Metadata saved to nft_metadata.json');
  } catch (error) {
    console.error('Error saving metadata to file:', error);
  }

  const metadataCid = await uploadToIPFS(metadata);

  if (metadataCid) {
    console.log('\n--- Next Steps ---');
    console.log(
      `In your NFT smart contract's \`mintToken\` function, you would use the following URI:`
    );
    console.log(`\`ipfs://${metadataCid}\``);
    console.log(
      'Make sure your IPFS node is running or you are using an IPFS pinning service.'
    );
  }
}

main();