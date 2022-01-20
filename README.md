# EC2 IAM Instance Profile Info

Uses your IntelligentDiscovery API to pull all EC2 IAM Profiles in your AWS account(s) and validate the IAM Roles associated with each. The roles are then related and validated against the managed policies that are attached to see if SSM is enabled and / or if the EC2 Instance Profile has any type of admin rights associated. Namely **AdministratorAccess** or **IAMFullAccess**. Data is written into 2 .csv files:

* ec2Instances.csv
* InstanceProfiles.csv


## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

This project was written using nodejs v16.13.0 runtime, however the libraries being used have been in use for quite sometime and previous version of nodejs LTS should work as well.

```
node.exe -v
```

### Installing

Clone this repository using git

```
git clone https://github.com/ldaptive/ec2-iam-profle-validation.git
```

Once cloned, navigate inside the directory and install required libraries

```
npm install
```
Edit the file the *index.js* and add your credetials here.

```
// change this line
var credentials = { username: 'ID-API-UserName', password: 'IDPassword' };

// to your credentials
var credentials = { username: 'example@domain.com', password: 'P@ssword!' };
```

Navigate to the **controllers** folder and edit the *intelligentDiscovery.js* file

```
// change this line
var baseUrl = '<your IntelligentDiscovery URL>' 

// SaaS url example:
var baseUrl = 'https://mycompany.intelligentdiscovery.io'  

// In Account or MSP Deployment example:
var baseUrl = 'https://myapp.example.com'  
```
## License

This project is licensed under the Apache License - and free to use or edit in anyway you see fit.

