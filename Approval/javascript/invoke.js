
'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');

const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');

async function main() {
    try {
         // Create a new file system based wallet for managing identities.
         const walletPath = path.join(process.cwd(), 'wallet');
         const wallet = new FileSystemWallet(walletPath);
         console.log(`Wallet path: ${walletPath}`);
 
         // Check to see if we've already enrolled the user.
         const userExists = await wallet.exists('HomeAccount');
         if (!userExists) {
             console.log('An identity for the user "HomeAccount" does not exist in the wallet');
             console.log('Run the app.js application before retrying');
             return;
            }
         
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'HomeAccount', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
    
        
         // Get the contract from the network.
        const contract = network.getContract('Approval');  

        // Submit the specified transaction.
        // createInvoiceDetails transaction.
        // changeInvoiceDetailStatus transaction.
        await contract.submitTransaction('createInvoiceDetails','billNumber', 'settlementAccount', 'sourcePartnerID', 'destinationPartnerID', 'amount', 'amountCurrency', 'status');
        console.log('Transaction has been submitted');
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}


main();