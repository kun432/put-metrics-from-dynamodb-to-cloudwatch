'use strict';
const AWS = require('aws-sdk');

var config = new AWS.Config({
  region: 'ap-northeast-1'
});
const dynamodb = new AWS.DynamoDB(config);
const cloudwatch = new AWS.CloudWatch(config);
const nameSpacePrefix = 'Custom';

exports.handler = async (event, context, callback) => {
  var params = {
    Limit: 100
  };
  try {
    const t = await getTableNames(params);
    console.log(t);

    let tableArr = [];
    for (const d of t.TableNames) {
      console.log(`test: ${d}`);
      tableArr.push(getTableInfo({ TableName: d }));
    }
    let tableInfos = await Promise.all(tableArr);
    console.log(`tableInfos: ${JSON.stringify(tableInfos)}`);
    
    let metricArr = [];
    for (const m of tableInfos) {
      let metric = {
        MetricData: [
          {
            MetricName: 'ItemCount',
            Dimensions: [
              {
                Name: 'TableName',
                Value: m.Table.TableName
              },
            ],
            Timestamp: new Date(),
            Unit: 'Count',
            Value: m.Table.ItemCount
          },
          {
            MetricName: 'TableSizeBytes',
            Dimensions: [
              {
                Name: 'TableName',
                Value: m.Table.TableName
              },
            ],
            Timestamp: new Date(),
            Unit: 'Bytes',
            Value: m.Table.TableSizeBytes
          }
        ],
        Namespace: nameSpacePrefix
      };
      metricArr.push(putData(metric));
    }
    await Promise.all(metricArr);
    console.log('DONE');
  } catch (err) {
    console.log(err, err.stack);
  }
};

const getTableNames = (params) => {
  return dynamodb.listTables(params, (err, data) => {
    if (err) err;
    else data;
  }).promise();
}

const getTableInfo = (params) => {
  return dynamodb.describeTable(params, (err, data) => {
    if (err) err;
    else data;
  }).promise();
}

const putData = (params) => {
  return cloudwatch.putMetricData(params, (err, data) => {
    if (err) err;
    else data;
  }).promise();
}