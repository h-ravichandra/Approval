var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/createHomeAccount', (req, res) => {
  let HomeAccount = req.query.HomeAccount;
  var Path = "/home/nithin/brtfabric/fabric-samples/brt360/connectedVehicles/wallet/"+HomeAccount;
  var contents = '';
  
  async function main() {
      try {
          const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
          const caTLSCACerts = caInfo.tlsCACerts.pem;
          const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
  
          const walletPath = path.join(process.cwd(), 'wallet');
          const wallet = new FileSystemWallet(walletPath);
          console.log(`Wallet path: ${walletPath}`);
  
          // Check to see if we've already enrolled the admin user.
          const adminExists = await wallet.exists(HomeAccount);
          if (adminExists) {
              console.log('An identity for the admin user "HomeAccount" already exists in the wallet');
              return;
          }
  
          // Enroll the admin user, and import the new identity into the wallet.
          const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
          const identity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
          await wallet.import(HomeAccount, identity);
          console.log('Successfully enrolled admin user "HomeAccount" and imported it into the wallet');
          fs.readdir(Path, function(err, items) {
            for (var i=0; i<items.length; i++) {
                         if(items[i].includes('-pub')){
                          contents = items[i] ; 
            var publickey = fs.readFileSync(Path+"/"+contents, 'utf8');                
            res.status(200).json({"PublicKey": publickey,"PrivateKey" : enrollment.key.toBytes()});
                }
            }
         });
      } catch (error) {
          console.error(`Failed to enroll admin user "HomeAccount": ${error}`);
          process.exit(1);
      }
  }
  
  main();
  
})

app.get('/createPartnerAccount', (req, res) => {
  let PartnerAccount = req.query.PartnerAccount;
 
  var Path = "/home/nithin/brtfabric/fabric-samples/brt360/connectedVehicles/wallet/"+PartnerAccount;
  var contents = '';
 
  async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(PartnerAccount);
        if (userExists) {
            res.status(200).json({"error": 'An identity for the user "PartnerAccount" already exists in the wallet'});
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('HomeAccountAdmin');
        if (!adminExists) {
            res.status(200).json({"error": 'An identity for the admin user HomeAccountAdmin does not exist in the wallet'});
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'HomeAccountAdmin', discovery: { enabled: true, asLocalhost: true } });

        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        
        const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: PartnerAccount, role: 'client' }, adminIdentity);
        const enrollment = await ca.enroll({ enrollmentID: PartnerAccount, enrollmentSecret: secret });
        const userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(PartnerAccount, userIdentity);
        
        console.log('Successfully registered and enrolled admin user "PartnerAccount" and imported it into the wallet');
        
        fs.readdir(Path, function(err, items) {
          for (var i=0; i<items.length; i++) {
                       if(items[i].includes('-pub')){
                        contents = items[i] ;
          var publickey = fs.readFileSync(Path+"/"+contents, 'utf8');               
          res.status(200).json({"PublicKey": publickey,"PrivateKey" : enrollment.key.toBytes()});
              }
          }
       });
    } catch (error) {
        res.status(200).json({"error": error});
        process.exit(1);
    }
}

main();

});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
//ssh brt@192.168.1.62
//brt@1234