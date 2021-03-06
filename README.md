# Serverless Adobe Campaign Standard - MS Dynamics integration


This Adobe IO Runtime service is a Node.js service allows you send profile from Adobe Campaign Standard to Microsoft Dynamics. The integration is workflow based and requires and Amazon S3 bucket. The response of the serverless function allows you to update the campaign profile with the leadId of the Dynamics entity.

You can find a oveview of this integration on [youtube](https://youtu.be/1_5-ujQAxHs)

Invocation example:

```html
https://adobeioruntime.net/api/v1/web/mmeewis-ns/dynamics-runtime-api/tranferLeadsFromACSToDynamics.http?bucketName=acs-mmeewis&fileName=toDynamics.csv
```

## Prerequisites

Before you can deploy this service make sure that you have installed and configured:

* Install OpenWhisk
* Configure .wskprops (in your $HOME) with your Adobe IO Runtime information

```config
AUTH=0d9c2a1f-....
APIHOST=adobeioruntime.net
NAMESPACE=mmeewis-ns
```
* Install Serverless

```config
npm install -g serverless
```

* Update dynamicsConfig.js with your S3 bucket and Microsoft Dynamics credentials 

```javascript
module.exports = {
  amazon : 
    {
      s3 : {
        accessKeyId: "xxx",
        secretAccessKey: "xxxx",
        region : "eu-west-1"
      }
    },
  dynamics : {
     login: 'https://login.microsoftonline.com/xxxxx/oauth2/token',
     resource: 'https://xxxx.crm4.dynamics.com',
     client_id: 'xxxxx',
     client_secret: 'xxxxx',
     grant_type: 'client_credentials' 
  }
}

// var campaignInstance = "marcmeewis-230217";
```

## Install

* Download and unzip this project, execute the following command in the project's folder

```
$ npm install
```

## Deploy Service

Use the `serverless` command to deploy your service.

```shell
serverless deploy
```

Download [Adobe Campaign Standard Workflow](196935732.zip)

Adobe Campaign Standard Workflow

![acs-workflow-dynamics-sync.png](acs-workflow-dynamics-sync.png)


