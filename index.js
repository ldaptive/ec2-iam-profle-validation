const ID = require('./controllers/intelligentDiscovery');       // IntelligentDiscovery API Calls
const { Parser } = require('json2csv');                         // Used for parsing json --> csv file
const fs = require('fs');                                       // Used to write to file system

var main = async () => {
    // setting our IntelligentDiscovery username and password for authentication
    var credentials = { username: 'ID-API-UserName', password: 'IDPassword' };

    //sending our credentials to authenticate with ID and getting back bearer token for api calls
    var token = await ID.authenticate(credentials);
    console.log('here is my token', token);

    // getting all our EC2 instances from our API endpoint
    var ec2 = await ID.apiGet(token, '/api/ec2/instances?RecordStatus=Active&State=running&fields=ImageId,IamInstanceProfile,accountId,accountName,Ssm,SsmStatus,InstanceId,Region,PublicIpAddress,Platform');

    // getting all our unique EC2 IAM Instance roles for us to lookup
    var instanceRoles = [];
    ec2.forEach(x => {
        if (instanceRoles.filter(f => f.accountId === x.accountId && f.IamInstanceProfile === x.IamInstanceProfile).length === 0) {
            // we dont have a record of this, adding to instanceRoles array
            instanceRoles.push({ accountId: x.accountId, IamInstanceProfile: x.IamInstanceProfile });
        };
    });

    // just writing out the count of our unique instanceRoles
    console.log('unique IAM ROles', instanceRoles.length);

    // getting our Active EC2 instance profiles used or not
    var allInstanceProfiles = await ID.apiGet(token, '/api/iam/instanceprofiles?RecordStatus=Active&fields=*');

    var InstanceProfiles = [];

    // looping through all of our Instance Profiles and getting associated roles managed policies
    for (var i = 0; i < allInstanceProfiles.length; i++) {
        // console.log(allInstanceProfiles[i].InstanceProfileName)
        allInstanceProfiles[i].AssociatedIamRole = '';
        if (allInstanceProfiles[i].Roles) {
            // if we have a role associated then we can validate its permission
            if (allInstanceProfiles[i].Roles.length > 0) {
                //setting information found on the attached role so easier to add for the .csv file
                allInstanceProfiles[i].AssociatedIamRole = allInstanceProfiles[i].Roles[0].RoleName;
                allInstanceProfiles[i].AssociatedIamRoleArn = allInstanceProfiles[i].Roles[0].Arn;

                // getting the specific role attached to the IAM profile
                var roleData = await ID.apiGet(token, `/api/iam/roles/${allInstanceProfiles[i].accountId}/${allInstanceProfiles[i].Roles[0].RoleName}?fields=*`)

                // setting Policy information to false until we find something
                allInstanceProfiles[i].HasSsmManagedPolicy = false;
                allInstanceProfiles[i].HasFullAdminAccess = false;
                allInstanceProfiles[i].HasIamAdmin = false;
                if (roleData.ManagedPolicies) {
                    // we have managed policies so adding that to the IAM Role
                    allInstanceProfiles[i].ManagedPolicies = roleData.ManagedPolicies;
                    allInstanceProfiles[i].MangedPolicyLength = roleData.ManagedPolicies.length;

                    // looping through all our managed polices to see if we get a hit on admin or SSM
                    roleData.ManagedPolicies.forEach(x => {
                        if (x.PolicyName.toUpperCase().includes('SSM')) {
                            // we have SSM setting to true
                            allInstanceProfiles[i].HasSsmManagedPolicy = true;
                        };
                        if (x.PolicyName.includes('AdministratorAccess')) {
                            // we have Full admin setting to true
                            allInstanceProfiles[i].HasFullAdminAccess = true;
                        };
                        if (x.PolicyName.includes('IAMFullAccess')) {
                            // we have IAM admin setting to true
                            allInstanceProfiles[i].HasIamAdmin = true;
                        };
                    });
                }
            }
        } else {
            // no Managed polices are attached so SSM is false
            allInstanceProfiles[i].HasSsmManagedPolicy = false;
        };

        // adding the count of EC2 instances that are attached to the IAM Profile
        allInstanceProfiles[i].AttachedEC2 = ec2.filter(f => f.accountId === allInstanceProfiles[i].accountId && f.IamInstanceProfile === allInstanceProfiles[i].Arn).length;

        //creating a new object to edit so we don't mess with original
        var profile = JSON.parse(JSON.stringify(allInstanceProfiles[i]));

        // deleting data not important for .csv file
        delete profile.Roles;
        delete profile.ManagedPolicies;

        // adding the count of EC2 instances that are attached to the IAM Profile
        InstanceProfiles.push(profile);
        console.log(allInstanceProfiles[i]);
    };



    try {
        // creating the fields for the .csv file that we want data on
        const fields = ['accountId', 'accountName', 'InstanceProfileId', 'InstanceProfileName', 'CreateDate', 'Arn', 'AssociatedIamRole', 'AssociatedIamRoleArn', 'HasSsmManagedPolicy', 'HasFullAdminAccess', 'HasIamAdmin', 'MangedPolicyLength', 'AttachedEC2'];
        const opts = { fields };                        // setting options for csv parser
        const parser = new Parser(opts);                // declaring our csv parser
        const csv = parser.parse(InstanceProfiles);     // specifying what data array we want to write out

        //writing our data to the .csv file and saving in code directory
        fs.writeFileSync('InstanceProfiles.csv', csv, (err, resp) => {
            if (err) console.log('i have an error writing file', err.message);
            else console.log('file written')
        });
    } catch (err) {
        console.error(err);
    };

    // looping through each EC2 instance and associating each IAM profile to the EC2 instance
    // adding data related to Ssm Managed Policy, FullAdmin Policy and IAMPolicy
    ec2.forEach(x => {
        var profile = InstanceProfiles.find(f => f.Arn === x.IamInstanceProfile);
        if (profile) {
            x.HasSsmManagedPolicy = profile.HasSsmManagedPolicy;
            x.HasFullAdminAccess = profile.HasFullAdminAccess;
            x.HasIamAdmin = profile.HasIamAdmin;
        };
    });

    try {
        // creating the fields for the .csv file that we want data on
        const fields = ['accountId', 'accountName', 'ImageId', 'Ssm', 'IamInstanceProfile', 'SsmStatus', 'InstanceId', 'Region', 'PublicIpAddress', 'Platform', 'Region', 'HasSsmManagedPolicy', 'HasFullAdminAccess', 'HasIamAdmin'];
        const opts = { fields };                    // setting options for csv parser
        const parser = new Parser(opts);            // declaring our csv parser
        const csv = parser.parse(ec2);              // specifying what data array we want to write out

        //writing our data to the .csv file and saving in code directory
        fs.writeFileSync('ec2Instances.csv', csv, (err, resp) => {
            if (err) console.log('i have an error writing file', err.message);
            else console.log('file written')
        });
    } catch (err) {
        console.error(err);
    };
};
main();
