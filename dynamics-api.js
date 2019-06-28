'use strict';

const dynamicsConfig = require('./dynamicsConfig.js')

const request = require('request');

var AWS = require('aws-sdk'); 

function dynamicsAuthenticate(params) {
    
    console.log("dynamicsAuthenticate");
    
    return new Promise (function (resolve, reject) {
        
        console.log("In Promise dynamicsAuthenticate");
        
        var options = { 
                method: 'POST',
                url: dynamicsConfig.dynamics.login,
                headers: 
                { 
                    'cache-control': 'no-cache',
                    'content-type': 'multipart/form-data' 
                },
                formData: 
                { 
                    resource: dynamicsConfig.dynamics.resource,
                    client_id: dynamicsConfig.dynamics.client_id,
                    client_secret: dynamicsConfig.dynamics.client_secret,
                    grant_type: dynamicsConfig.dynamics.grant_type 
                } 
        };

        console.log("About to request");
        
        request(options, function (error, response, body) {
            
            console.log("Request response");
            
              if (error) {
                  console.log("error : " + error);
                  reject(error);
              }
            
              var result = JSON.parse(body);

              console.log("Authentication response : " + result.access_token);

              params.bearer = result.access_token;
            
              console.log("Params after authentication : " + JSON.stringify(params)); 

              resolve(params);
        
        });
        
    });
    
}

function createDynamicsLead(bearer, lead, i) {
    
    console.log("createDynamicsLead");
    
    return new Promise (function (resolve, reject) {
        console.log("Lead : " + i + " => " + JSON.stringify(lead));
        
        var options = { method: 'POST',
          url: dynamicsConfig.dynamics.resource + '/api/data/v9.0/leads',
          qs: { '$select': 'leadid, fullname' },
          headers: 
           { 
             'cache-control': 'no-cache',
             Authorization: 'Bearer ' + bearer,
             Prefer: 'return=representation',
             'Content-Type': 'application/json; charset=utf-8',
             Accept: 'application/json',
             'OData-Version': '4.0',
             'OData-MaxVersion': '4.0' 
          },
          body: JSON.stringify(lead)
        };

        request(options, function (error, response, body) {
          if (error) {
            reject(error);   
          }

          console.log(body);
        
          var dLead = JSON.parse(body);
          lead.leadid = dLead.leadid;
            
          resolve(lead);    
        });
        
    });
    
}

function createDynamicsLeads(params) {
    
    console.log("params in : " + JSON.stringify(params));
    
    return new Promise (function (resolve, reject) {
    
    

        var jsonData = params.jsonData;

        var leads = jsonData.objects;

        console.log("About to create dynamics leads : " + leads.length );


        console.log("Processing leads");
        /*

        for (var l=0; l < leads.length; l++) {
           console.log("create promise for : " + l);
           var response = await createDynamicsLead(leads, lead[l], l);
           console.log("Await Response = " + JSON.stringify(response));
        }
        */

        try {
            var promises = [];

            
            for (var l=0; l < leads.length; l++) {
                var promise = new Promise(function (resolve, reject) { 
                        console.log("Timeout : " + l);
                        // leads[l].id = l;
                        createDynamicsLead(params.bearer, leads[l], l).then(
                            function(data) {
                                resolve(data);
                            },
                            function (err) {
                                reject(err);
                            }
                        )
                        }); 

                promises.push(promise);
            }

 //           console.log("promises : " + JSON.stringify(promises));

            Promise.all(promises)
                .then(values => { 
                  console.log(values);
                  params.dynamicsResponse = values;
                  resolve(params);
                })
                .catch(error => { 
                  console.log(error.message)
                });

   //         console.log("Result " + JSON.stringify(result));
            
        }
        catch(err) {
            reject(err);
        }
    
        // console.log("createDynamicsLeads exit " + JSON.stringify(params));
        
    });
}



function convertCSVToJson(params) {
    
    var csvData = params.csvData;
    
    var lines = csvData.split("\n");
    
    var jsonData = {};
    var objects = [];
    
    var objectIdx = 0;
    
    jsonData.objects = objects;
    
    // first line should be columns name that match MS dynamics field names, delimiter should be ";"
    
    return new Promise (function (resolve, reject) {
    
        var headers = lines[0].split(";");
        

        for (var l=1; l < lines.length; l++) {
            var csvLine = lines[l];
            var lineValues = csvLine.split(";");
            
            if (lineValues.length > 1) {

                var jsonObject = {};

                for (var h=0; h < headers.length; h++) {
                    jsonObject[headers[h]] = lineValues[h];
                }

                console.log("jsonObject[" + objectIdx + "] : " + JSON.stringify(jsonObject) );

                objects[objectIdx] = jsonObject;
                objectIdx++;
            }
        }
    
        console.log("jsonData : " + JSON.stringify(jsonData));
        
        params.jsonData = jsonData;
        
        resolve(params);
    });
}

function convertJsonToCSV(params) {
    
    console.log("convertJsonToCSV : " + JSON.stringify(params));
    
    return new Promise (function (resolve, reject) {
    
        var csvResponse = "";

        var jsonData = params.jsonData;

        var leads = jsonData.objects;

        if (leads.length > 0) {

            var keys = Object.keys(leads[0]);
            var separator = "";

            for (var k=0; k < keys.length; k++) {
                csvResponse += separator + keys[k];
                separator = ";"
            }

            csvResponse += "\n";

            for (var l=0; l<leads.length; l++) {

                var lead = leads[l];

                separator = "";

                for (var k=0; k < keys.length; k++) {
                    csvResponse += separator + lead[keys[k]];
                    separator = ";";
                }

                csvResponse += "\n";

            }

        }
        
        console.log("csvResponse : " + csvResponse);

        params.csvResponse = csvResponse;
        
        resolve(params);
        
    });
    
}

function outputCSV(params) {
    
    return new Promise (function (resolve, reject) {
       
        var response = { 
                headers: { 'Content-Type': 'text/csv',
                           'Content-Disposition':'attachment;filename=dynamicsResponse.csv'
                         },
                statusCode: 200,
                body: params.csvResponse 
            };
        
        
        resolve(response);
        
    });
    
}

// https://adobeioruntime.net/api/v1/web/mmeewis-ns/dyn-api/processS3Bucket.json?bucketName=acs-mmeewis&fileName=toDynamics.csv

function processS3Bucket(params) {
    
    console.log("Bucketname : " + params.bucketName);
    console.log("Bucketname : " + params.fileName);
    
    var bucketName = params.bucketName;
    var fileName = params.fileName;
    
    var csvData = {}
    params.csvData = csvData
    
    return new Promise (function (resolve, reject) {
        
        AWS.config.update({
                "accessKeyId": dynamicsConfig.amazon.s3.accessKeyId,
                "secretAccessKey": dynamicsConfig.amazon.s3.secretAccessKey,
                "region": dynamicsConfig.amazon.s3.region 
        });
        var s3 = new AWS.S3({
            signatureVersion: 'v4'
        });  
        
        var params = {
          Bucket: bucketName, 
          Key: fileName
        };
        s3.getObject(params, function(err, data) {
           if (err) {
               console.log(err, err.stack); // an error occurred
               reject(err);
           }
           else {
               console.log(data);  
               csvData = data.Body.toString("utf-8");
               params.csvData = csvData;
               // params.jsonData = convertCSVToJson(params);
               // console.log("About to create dynamics leads");
               resolve(params);
               
           }
         });
        
    });
    
}

function getLeadByCampaignCustomerId(params) {

    var campaignCustomerId = params.campaignCustomerId;
    
    var qs = "contains(new_adobecampaigncustomerid,'" + campaignCustomerId + "')";
    
    return new Promise (function (resolve, reject) {

        var options = { 
          method: 'GET',
          url: dynamicsConfig.dynamics.resource + '/api/data/v9.0/leads',
          qs: { '$filter': qs },
          headers: 
           { 'cache-control': 'no-cache',
             Authorization: 'Bearer ' + params.bearer,
             Prefer: 'odata.include-annotations=OData.Community.Display.V1.FormattedValue',
             'Content-Type': 'application/json; charset=utf-8',
             'OData-Version': '4.0',
             'OData-MaxVersion': '4.0' } 
        };

        request(options, function (error, response, body) {
          if (error) {
              reject(error);
          }
            
          console.log(body);    
            
          params.dynamicsResponse = JSON.parse(body);
            
          resolve(params);

          
        });

    
    });
    
}
                        
function getDynamicsResponse(params) {
    
    return new Promise (function (resolve, reject) {
    
        resolve(params.dynamicsResponse);
        
    });
}

/*
s3.listObjects(params, function (err, response) {
            if (err) {
                reject(err);
            } else {
                console.log("AWS Response : " + JSON.stringify(response));
                console.log("AWS Content Length : " + response.Contents.length);
                var contentLength = response.Contents.length;
                for(var i = 0; i < contentLength; i++){
                    
                    
                    var bucket = {};
                    bucket.name = bucketName;
                    bucket.key = response.Contents[i].Key;
                    bucket.url = "https://s3.amazonaws.com/" + bucketName + "/" + response.Contents[i].Key;
                    
                    s3BucketList[bucket.key] = bucket;
                    
                }
                    
                resolve(s3BucketList);
            }                
        });
*/

exports.processS3Bucket = processS3Bucket;
exports.convertCSVToJson = convertCSVToJson;
exports.createDynamicsLeads = createDynamicsLeads;
exports.dynamicsAuthenticate = dynamicsAuthenticate;
exports.convertJsonToCSV = convertJsonToCSV;
exports.outputCSV = outputCSV;
exports.getLeadByCampaignCustomerId = getLeadByCampaignCustomerId;
exports.getDynamicsResponse = getDynamicsResponse;

