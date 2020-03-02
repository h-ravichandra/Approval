/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const Fabric_Client = require('fabric-client');


class Approval extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const invoiceDetails = [
            {
                settlementAccount : ' ',
                sourcePartnerID: ' ',
                destinationPartnerID: ' ',
                amount: ' ',
                amountCurrency : ' ',
                status : ' ',
            },
        ];

        for (let i = 0; i < invoiceDetails.length; i++) {
            invoiceDetails[i].docType = 'InvoiceDetails';
            await ctx.stub.putState('Invoice' + i, Buffer.from(JSON.stringify(invoiceDetails[i])));
            console.info('Added <--> ', invoiceDetails[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryInvoiceDetails(ctx, billNumber) {
        const invoiceDetailsAsBytes = await ctx.stub.getState(billNumber);
        if (!invoiceDetailsAsBytes || invoiceDetailsAsBytes.length === 0) {
            throw new Error(`${billNumber} does not exist`);
        }
        console.log(invoiceDetailsAsBytes.toString());
        return invoiceDetailsAsBytes.toString();
    }

    async createInvoiceDetails(ctx, billNumber, settlementAccount, sourcePartnerID, destinationPartnerID, amount, amountCurrency, status) {
        console.info('============= START : Create InvoiceDetails ===========');
        
        const fabric_client = new Fabric_Client();
        const InvoiceDetails = {
            settlementAccount,
            docType: 'InvoiceDetails',
            sourcePartnerID,
            destinationPartnerID,
            amount,
            amountCurrency,
            status,
        };
        
        const tx_id = fabric_client.newTransactionID();
        
        await ctx.stub.putState(billNumber, Buffer.from(JSON.stringify(InvoiceDetails)));
		console.log(util.format("\nCreated a transaction ID: %s", tx_id.getTransactionID()));
        console.info('============= END : Create InvoiceDetails ===========');
    }

    async queryAllInvoiceDetails(ctx, startBillNumber, endBillNumber) {
        
        const iterator = await ctx.stub.getStateByRange(startBillNumber, endBillNumber);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    async changeStatus(ctx, billNumber, newStatus) {
        console.info('============= START : changeStatus ===========');

        const invoiceDetailsAsBytes = await ctx.stub.getState(billNumber); 
        if (!invoiceDetailsAsBytes || invoiceDetailsAsBytes.length === 0) {
            throw new Error(`${billNumber} does not exist`);
        }
        const InvoiceDetails = JSON.parse(invoiceDetailsAsBytes.toString());
        InvoiceDetails.status = newStatus;

        await ctx.stub.putState(billNumber, Buffer.from(JSON.stringify(InvoiceDetails)));
        console.info('============= END : changeStatus ===========');
    }

}

module.exports = Approval;
